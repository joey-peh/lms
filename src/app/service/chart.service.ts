import { Inject, Injectable } from '@angular/core';
import { ChartDataset } from 'chart.js';
import {
  CommonChart,
  Course,
  Enrollment,
  EnrollmentDetails,
  EntryDetails,
  Topic,
  TopicDetails,
} from '../models/lms-models';
import { LmsSandboxService } from '../store/sandbox/lms-sandbox-service';
import { switchMap, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  constructor(private sandbox: LmsSandboxService) {}

  private getDynamicVh(referenceHeight: number = 288): string {
    const viewportHeight = window.innerHeight; // Current viewport height in pixels
    const vh = (referenceHeight / viewportHeight) * 100;
    return `${vh.toFixed(2)}vh`; // Round to 2 decimal places
  }

  getUserRole = (userId: string, users: EnrollmentDetails[]) => {
    const user = users.find((u) => u.user_id.toString() === userId);
    return user?.enrollment_type?.toLowerCase();
  };

  getEntriesPerCourse(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      switchMap((topicsWithDetails: TopicDetails[]) =>
        this.sandbox.getCourses().pipe(
          switchMap((courses: Course[]) =>
            this.sandbox.getEnrollmentDetails().pipe(
              map((users: EnrollmentDetails[]) => {
                const studentData: Record<string, number> = {};
                const teacherData: Record<string, number> = {};

                for (const topic of topicsWithDetails) {
                  const courseId = topic.course_id.toString();
                  for (const entry of topic.entries) {
                    const userId = entry.entry_posted_by_user_id.toString();
                    const role = this.getUserRole(userId, users);
                    if (role === 'student') {
                      studentData[courseId] = (studentData[courseId] || 0) + 1;
                    } else if (role === 'teacher') {
                      teacherData[courseId] = (teacherData[courseId] || 0) + 1;
                    }
                  }
                }

                const courseIdToName = (id: string) =>
                  courses.find((c) => c.course_id.toString() === id)
                    ?.course_name ?? '';

                const { labels, counts: studentCounts } =
                  this.getTop5SortedLabelsAndCounts(
                    studentData,
                    courseIdToName
                  );

                const teacherCounts = labels.map((label: string) => {
                  const id = Object.keys(teacherData).find(
                    (courseId) => courseIdToName(courseId) === label
                  );
                  return id ? teacherData[id] || 0 : 0;
                });

                const barChartData: ChartDataset[] = [
                  { data: studentCounts, label: 'Entries by Students' },
                  { data: teacherCounts, label: 'Entries by Teachers' },
                ];

                return {
                  title: 'Entries per Course by Role',
                  subtitle:
                    'Breaks down entries by students versus instructors for each course.',
                  barChartLabels: labels.length ? labels : ['No Data'],
                  barChartData,
                  barChartType: 'bar',
                  barChartLegend: true,
                  height: this.getDynamicVh(),
                  maxValue: this.getMaxValue(barChartData),
                } as CommonChart;
              })
            )
          )
        )
      )
    );
  }

  getEntriesByStudent(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[]
  ): CommonChart {
    // Flatten all entries
    const allEntries: EntryDetails[] = topicsWithDetails
      .map((x) => x.entries)
      .flat();

    // Create a set of student user IDs for quick lookup
    const studentIds = new Set(
      users
        .filter((u) => u.enrollment_type?.toLowerCase() === 'student')
        .map((u) => u.user_id.toString())
    );

    // Count only student entries
    const data: { [key: string]: number } = allEntries.reduce((acc, entry) => {
      const userId = entry.entry_posted_by_user_id.toString();
      if (studentIds.has(userId)) {
        acc[userId] = (acc[userId] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    // Convert user IDs to names and get top 5
    const { labels, counts } = this.getTop5SortedLabelsAndCounts(
      data,
      (userId: string) =>
        users.find((u) => u.user_id.toString() === userId)?.user.user_name ?? ''
    );

    const barChartData: ChartDataset[] = [
      { data: counts, label: 'Student Entries' },
    ];

    return {
      title: 'Top 5 Students by Entry Count',
      subtitle:
        'Identifies the top five students based on the number of entries, recognizing the most active participants.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getDiscussionActivityOverTime(
    topicsWithDetails: TopicDetails[]
  ): CommonChart {
    const activityOverTime: { [key: string]: number } = {};

    // Count number of posts per day/week
    for (const topic of topicsWithDetails) {
      for (const entry of topic.entries) {
        const dateStr = entry.entry_created_at;
        if (dateStr && dateStr !== 'N/A') {
          const date = new Date(
            dateStr.split(', ')[0].split('/').reverse().join('-')
          );
          if (!isNaN(date.getTime())) {
            const dateKey = `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()}`;
            activityOverTime[dateKey] = (activityOverTime[dateKey] || 0) + 1;
          }
        }
      }
    }

    const sortedDates = Object.keys(activityOverTime).sort();
    const labels = sortedDates;
    const data = sortedDates.map((key) => activityOverTime[key]);

    return {
      title: 'Discussion Activity Trends',
      subtitle:
        'Tracks the number of posts over time, revealing patterns and peaks in discussion activity.',
      barChartLabels: labels,
      barChartData: [{ data, label: 'Discussion Activity' }],
      barChartType: 'line', // Change to 'bar' if you want a bar chart
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue([{ data }]),
    };
  }

  getEngagementByCourse(
    topicsWithDetails: TopicDetails[],
    courses: Course[],
    users: EnrollmentDetails[]
  ): CommonChart {
    const engagementData: {
      [courseId: string]: { [studentId: string]: number };
    } = {};

    for (const topic of topicsWithDetails) {
      const courseId = topic.course_id.toString();
      for (const entry of topic.entries) {
        const studentId = entry.entry_posted_by_user_id.toString();
        engagementData[courseId] = engagementData[courseId] || {};
        engagementData[courseId][studentId] =
          (engagementData[courseId][studentId] || 0) + 1;
      }
    }

    const courseIdToName = (id: string) =>
      courses.find((c) => c.course_id.toString() === id)?.course_name ?? '';

    const usersById: Record<string, string> = {};
    users.forEach((user) => {
      usersById[user.user_id.toString()] = user.user.user_name;
    });

    const ids = Object.keys(engagementData); // courseIds
    const labels = ids.map((id) => courseIdToName(id));

    // 1. Total engagement per student
    const totalByStudent: Record<string, number> = {};
    for (const courseId of ids) {
      const courseEngagement = engagementData[courseId];
      for (const [studentId, count] of Object.entries(courseEngagement)) {
        totalByStudent[studentId] = (totalByStudent[studentId] || 0) + count;
      }
    }
    // 2. Get top 5 students
    const topStudentIds = Object.entries(totalByStudent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([studentId]) => studentId);

    // 3. Generate chart data only for top 5
    const barChartData: ChartDataset[] = topStudentIds.map((studentId) => {
      const studentEngagements = ids.map(
        (id) => engagementData[id]?.[studentId] ?? 0
      );
      return {
        data: studentEngagements,
        label: usersById[studentId],
      };
    });

    return {
      title: 'Engagement by Course',
      subtitle:
        'Showcases the top five students by entry count across courses, emphasizing high engagement in discussion activities.',
      barChartLabels: labels,
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
      displayLabel: false,
    };
  }

  getTopicsPerCourse(courses: Course[], topics: Topic[]): CommonChart {
    const topicCountByState = (state: 'active' | 'inactive') =>
      topics
        .filter((topic) =>
          state === 'active'
            ? topic.topic_state === 'active'
            : topic.topic_state !== 'active'
        )
        .reduce((acc, course) => {
          const courseId = course.course_id;
          acc[courseId] = (acc[courseId] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

    const activeData = topicCountByState('active');
    const inactiveData = topicCountByState('inactive');

    const mapCourseToName = (courseId: string): string =>
      courses.find((c) => c.course_id.toString() === courseId)?.course_name ??
      '';

    const { labels, counts: activeCounts } = this.getTop5SortedLabelsAndCounts(
      activeData,
      mapCourseToName
    );

    const inactiveCounts = labels.map((label: string) => {
      const courseId = Object.keys(inactiveData).find(
        (id) => mapCourseToName(id) === label
      );
      return courseId ? inactiveData[courseId] || 0 : 0;
    });

    const barChartData: ChartDataset[] = [
      { data: activeCounts, label: 'Active Topics' },
      { data: inactiveCounts, label: 'Inactive Topics' },
    ];

    return {
      title: 'Course Topic Overview',
      subtitle:
        'View the number of topics created for each course, offering insights on creation activity.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }
  getTopicsOverTime(topics: Topic[]): CommonChart {
    const activeByMonth: Record<string, number> = {};
    const inactiveByMonth: Record<string, number> = {};

    topics.forEach((topic) => {
      const dateStr = topic.topic_created_at;
      if (dateStr && dateStr !== 'N/A') {
        // Convert dd/MM/yyyy to yyyy-MM-dd
        const date = new Date(
          dateStr.split(', ')[0].split('/').reverse().join('-')
        );
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g. 2024-5

          const target =
            topic.topic_state === 'active' ? activeByMonth : inactiveByMonth;

          target[monthYear] = (target[monthYear] || 0) + 1;
        }
      }
    });

    // Get union of all month keys
    const allMonths = Array.from(
      new Set([...Object.keys(activeByMonth), ...Object.keys(inactiveByMonth)])
    ).sort();

    const labels = allMonths;

    const activeCounts = labels.map((key) => activeByMonth[key] || 0);
    const inactiveCounts = labels.map((key) => inactiveByMonth[key] || 0);

    const barChartData: ChartDataset[] = [
      { data: activeCounts, label: 'Active Topics' },
      { data: inactiveCounts, label: 'Inactive Topics' },
    ];

    return {
      title: 'Topic Creation Trends',
      subtitle: 'Analyze topic creation over time to pinpoint peaks.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getTopicStatesDistribution(topics: Topic[]): CommonChart {
    const stateCounts = {
      active: topics.filter((topic) => topic.topic_state === 'active').length,
      unpublished: topics.filter((topic) => topic.topic_state === 'unpublished')
        .length,
      deleted: topics.filter((topic) => topic.topic_state === 'deleted').length,
    };

    const rawLabels = ['Active', 'Unpublished', 'Deleted'];
    const rawData = [
      stateCounts.active,
      stateCounts.unpublished,
      stateCounts.deleted,
    ];

    // Filter out labels and data where count is 0
    const filtered = rawLabels
      .map((label, i) => ({ label, count: rawData[i] }))
      .filter((item) => item.count > 0);

    const labels = filtered.map((item) => item.label);
    const data = filtered.map((item) => item.count);

    const barChartData: ChartDataset[] = [{ data, label: 'Topics' }];

    return {
      title: 'Topic Status Distribution',
      subtitle:
        'Monitor the distribution of states to track the progress and activity of topics.',
      barChartLabels: labels.length > 0 ? labels : ['No Data'],
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getTopicsPerUser(users: EnrollmentDetails[], topics: Topic[]): CommonChart {
    const userIdToUserName = new Map(
      users.map((user) => [user.user_id.toString(), user.user.user_name])
    );

    const topicCountByState = (state: 'active' | 'inactive') =>
      topics
        .filter((topic) =>
          state === 'active'
            ? topic.topic_state === 'active'
            : topic.topic_state !== 'active'
        )
        .reduce((acc: Record<string, number>, topic) => {
          const userId = topic.topic_posted_by_user_id;
          acc[userId] = (acc[userId] || 0) + 1;
          return acc;
        }, {});

    const activeData = topicCountByState('active');
    const inactiveData = topicCountByState('inactive');

    const mapUserIdToName = (userId: string) =>
      userIdToUserName.get(userId) ?? '';

    const { labels, counts: activeCounts } = this.getTop5SortedLabelsAndCounts(
      activeData,
      mapUserIdToName
    );

    const inactiveCounts = labels.map((label: string) => {
      const userId = Object.keys(inactiveData).find(
        (id) => mapUserIdToName(id) === label
      );
      return userId ? inactiveData[userId] || 0 : 0;
    });

    const barChartData: ChartDataset[] = [
      { data: activeCounts, label: 'Active Topics' },
      { data: inactiveCounts, label: 'Inactive Topics' },
    ];

    return {
      title: 'User Posting Activity',
      subtitle:
        'Identify the top five users by posting frequency, highlighting key contributors.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  createEnrollmentChartStats(
    courses: Course[],
    enrollments: Enrollment[]
  ): CommonChart {
    const data: { [key: string]: number } = courses.reduce((acc, course) => {
      const enrollmentCount = enrollments.filter(
        (e) =>
          e.course_id === course.course_id &&
          e.enrollment_state === 'active' &&
          e.enrollment_type === 'student'
      ).length;
      acc[course.course_id.toString()] = enrollmentCount;
      return acc;
    }, {} as { [key: string]: number });

    const { labels, counts } = this.getTop5SortedLabelsAndCounts(
      data,
      (courseId: string) =>
        courses.find((c) => c.course_id.toString() === courseId)?.course_name ??
        ''
    );

    const barChartData: ChartDataset[] = [
      { data: counts, label: 'Student Enrollments' },
    ];

    return {
      title: 'Student Enrollments by Course',
      subtitle:
        'Displays the number of student enrollments for each course, providing insight into course popularity.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getTopicsByRole(
    topics: TopicDetails[],
    users: EnrollmentDetails[]
  ): CommonChart {
    const counts = { Student: 0, Teacher: 0 };

    const getRole = (userId: string) =>
      users
        .find((u) => u.user_id.toString() === userId)
        ?.enrollment_type?.toLowerCase();

    for (const topic of topics) {
      const userId = topic.topic_posted_by_user_id.toString();
      const role = getRole(userId);
      if (role === 'student') {
        counts.Student += 1;
      } else if (role === 'teacher') {
        counts.Teacher += 1;
      }
    }

    const barChartData: ChartDataset[] = [
      { data: [counts.Student, counts.Teacher], label: 'Topics Created' },
    ];

    return {
      title: 'Topics by Role',
      subtitle:
        'Compares the number of topics created by students versus instructors, illustrating their respective contributions to course discussions.',
      barChartLabels: ['Students', 'Teachers'],
      barChartData,
      barChartType: 'doughnut',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getEntriesByRole(
    topicsWithDetails: TopicDetails[],
    users: EnrollmentDetails[]
  ): CommonChart {
    const counts = { Student: 0, Teacher: 0 };

    const getRole = (userId: string) =>
      users
        .find((u) => u.user_id.toString() === userId)
        ?.enrollment_type?.toLowerCase();

    for (const topic of topicsWithDetails) {
      for (const entry of topic.entries) {
        const userId = entry.entry_posted_by_user_id.toString();
        const role = getRole(userId);
        if (role === 'student') {
          counts.Student += 1;
        } else if (role === 'teacher') {
          counts.Teacher += 1;
        }
      }
    }

    const barChartData: ChartDataset[] = [
      { data: [counts.Student, counts.Teacher], label: 'Entries Posted' },
    ];

    return {
      title: 'Entries by Role',
      subtitle:
        'Analyzes the volume of entries posted by students versus instructors, providing insight into their participation levels.',
      barChartLabels: ['Students', 'Teachers'],
      barChartData,
      barChartType: 'doughnut',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  getEntriesOverTime(topicsWithDetails: TopicDetails[]): CommonChart {
    // Dictionary to store the count of entries per month
    const entriesByMonth: { [key: string]: number } = {};

    // Loop through each topic and its entries
    for (const topic of topicsWithDetails) {
      for (const entry of topic.entries) {
        const dateStr = entry.entry_created_at; // Assuming this field exists
        if (dateStr && dateStr !== 'N/A') {
          // Parse date string (Assumes format "dd/MM/yyyy")
          const date = new Date(
            dateStr.split(', ')[0].split('/').reverse().join('-')
          );
          if (!isNaN(date.getTime())) {
            // Format the date as "YYYY-MM"
            const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

            // Increment entry count for this month
            entriesByMonth[monthYear] = (entriesByMonth[monthYear] || 0) + 1;
          }
        }
      }
    }

    // Sort months in chronological order
    const sortedMonths = Object.keys(entriesByMonth).sort();
    const labels = sortedMonths;
    const data = sortedMonths.map((key) => entriesByMonth[key]);

    // Prepare the chart data
    const barChartData: ChartDataset[] = [
      { data: labels.length ? data : [0], label: 'Entries Over Time' },
    ];

    return {
      title: 'Entry Creation Trends',
      subtitle:
        'Visualizes the number of entries created per month, enabling instructors to monitor participation trends.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line', // You can change this to 'bar' if preferred
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }

  private getMaxValue(barChartData: ChartDataset[]): number {
    const data = barChartData
      .flatMap((dataset) =>
        Array.isArray(dataset.data)
          ? dataset.data.filter((val): val is number => val != null)
          : []
      )
      .filter((val) => val > 0);
    return data.length ? Math.ceil(Math.max(...data) * 1.2) : 1;
  }

  private getTop5SortedLabelsAndCounts(
    data: { [key: string]: number },
    mapKeyToLabel: (key: string) => string
  ): { labels: string[]; counts: number[] } {
    const sorted = Object.entries(data)
      .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
      .slice(0, 5); // Limit to top 5

    const labels: string[] = sorted.map(([key]) => mapKeyToLabel(key));
    const counts: number[] = sorted.map(([, count]) => count);

    return { labels, counts };
  }

  createPerCourseEnrollmentTrendChart(
    enrollments: EnrollmentDetails[]
  ): CommonChart {
    // Aggregate enrollments by course and month
    const enrollmentsByCourseAndMonth: {
      [courseId: number]: { [month: string]: number };
    } = {};

    enrollments.forEach((enrollment) => {
      if (
        enrollment.enrollment_state === 'active' &&
        enrollment.enrollment_type === 'student'
      ) {
        let date = new Date(enrollment.user.user_created_at);

        if (isNaN(date.getTime())) {
          date = this.parseCustomDate(enrollment.user.user_created_at);
        }

        if (isNaN(date.getTime())) {
          console.warn('warning', enrollment.user.user_created_at);
          return;
        }
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;
        const courseId = enrollment.course.course_id;
        if (!enrollmentsByCourseAndMonth[courseId]) {
          enrollmentsByCourseAndMonth[courseId] = {};
        }
        enrollmentsByCourseAndMonth[courseId][monthKey] =
          (enrollmentsByCourseAndMonth[courseId][monthKey] || 0) + 1;
      }
    });

    // Get all unique months across all courses
    const allMonths = new Set<string>();
    Object.values(enrollmentsByCourseAndMonth).forEach((courseMonths) => {
      Object.keys(courseMonths).forEach((month) => allMonths.add(month));
    });
    const sortedMonths = Array.from(allMonths).sort();

    // Create datasets for each course (non-cumulative)
    const lineChartData: ChartDataset[] = [];
    Object.keys(enrollmentsByCourseAndMonth).forEach((courseId) => {
      const course = enrollments.find(
        (e) => e.course.course_id === parseInt(courseId)
      )?.course;
      if (!course) return;

      // Non-cumulative: number of enrollments per month
      const enrollmentsPerMonth = sortedMonths.map(
        (month) => enrollmentsByCourseAndMonth[parseInt(courseId)][month] || 0
      );

      lineChartData.push({
        data: enrollmentsPerMonth,
        label: `${course.course_code}: ${course.course_name}`,
        fill: false,
        tension: 0.1,
      });
    });

    // Format labels as "MMM YYYY" (e.g., "May 2023")
    const labels = sortedMonths.map((month) => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    });

    // Handle empty data case
    if (labels.length === 0 || lineChartData.length === 0) {
      return {
        title: 'Per-Course Enrollment Trend',
        subtitle:
          'Displays monthly enrollment trends across courses to monitor growth and user engagement over time. Assumption: user.user_created_at represents the enrollment date for a course.',
        barChartLabels: ['No Data'],
        barChartData: [{ data: [0], label: 'No Enrollments', fill: false }],
        barChartType: 'line',
        barChartLegend: true,
        height: this.getDynamicVh(),
        maxValue: 0,
      };
    }

    return {
      title: 'Per-Course Enrollment Trend',
      subtitle:
        'Displays monthly enrollment trends across courses to monitor growth and user engagement over time. Assumption: user.user_created_at represents the enrollment date for a course.',
      barChartLabels: labels,
      barChartData: lineChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(lineChartData),
      displayLabel: false,
    };
  }

  parseCustomDate(dateStr: string): Date {
    const match = dateStr.match(
      /^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/
    );
    if (!match) return new Date(''); // Invalid format

    let [, day, month, year, hour, minute, second, period] = match;
    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    return new Date(
      `${year}-${month}-${day}T${h
        .toString()
        .padStart(2, '0')}:${minute}:${second}`
    );
  }

  getTopicPopularityChart(topicsWithDetails: TopicDetails[]): CommonChart {
    const topicData: Record<string, number> = {};

    // Count entries per topic
    for (const topic of topicsWithDetails) {
      const topicId = topic.topic_id.toString();
      const entryCount = topic.entries.length;
      topicData[topicId] = (topicData[topicId] || 0) + entryCount;
    }

    // Map topic ID to topic name
    const topicIdToName = (id: string) =>
      topicsWithDetails.find((t) => t.topic_id.toString() === id)
        ?.topic_title ?? '';

    // Get Top 5 Labels and Counts for Topics
    const { labels, counts: topicCounts } = this.getTop5SortedLabelsAndCounts(
      topicData,
      topicIdToName
    );

    const barChartData: ChartDataset[] = [
      { data: topicCounts, label: 'Entries per Topic' },
    ];

    return {
      title: 'Topic Popularity by Entry Count',
      subtitle:
        'Displays the number of entries for the top five most active topics, highlighting the most engaging discussions.',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(barChartData),
    };
  }
}
