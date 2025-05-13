import { Injectable } from '@angular/core';
import {
  TopicDetails,
  EnrollmentDetails,
  EntryDetails,
} from './csv-data-service.service';
import { ChartDataset } from 'chart.js';
import { Course, Enrollment, Topic } from '../models/lms-models';
import { CommonChart } from '../components/dashboard/dashboard.component';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  constructor() {}

  getUserRole = (userId: string, users: EnrollmentDetails[]) => {
    const user = users.find((u) => u.user_id.toString() === userId);
    return user?.enrollment_type?.toLowerCase();
  };

  getEntriesPerCourse(
    topicsWithDetails: TopicDetails[],
    courses: Course[],
    users: EnrollmentDetails[] // Added users to access roles
  ): CommonChart {
    const studentData: Record<string, number> = {};
    const teacherData: Record<string, number> = {};

    // Helper function to get the role of a user (Student or Teacher)
    const getUserRole = (userId: string) => {
      const user = users.find((u) => u.user_id.toString() === userId);
      return user?.enrollment_type?.toLowerCase();
    };

    for (const topic of topicsWithDetails) {
      const courseId = topic.course_id.toString();

      for (const entry of topic.entries) {
        const userId = entry.entry_posted_by_user_id.toString();
        const role = getUserRole(userId); // Get role for the entry's user

        if (role === 'student') {
          // Increment student entry count for the course
          studentData[courseId] = (studentData[courseId] || 0) + 1;
        } else if (role === 'teacher') {
          // Increment teacher entry count for the course
          teacherData[courseId] = (teacherData[courseId] || 0) + 1;
        }
      }
    }

    // Map course ID to course name
    const courseIdToName = (id: string) =>
      courses.find((c) => c.course_id.toString() === id)?.course_name ?? '';

    // Get Top 5 Labels and Counts for Students and Teachers
    const { labels, counts: studentCounts } = this.getTop5SortedLabelsAndCounts(
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
      subtitle: 'Entries by students vs. teachers for each course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
    };
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
      title: 'Entries by Students',
      subtitle: 'Top 5 students by number of entries',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
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
      title: 'Discussion Activity Over Time',
      subtitle: 'Number of posts made over time',
      barChartLabels: labels,
      barChartData: [{ data, label: 'Discussion Activity' }],
      barChartType: 'line', // Change to 'bar' if you want a bar chart
      barChartLegend: true,
      height: '20vh',
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
      subtitle: 'Top 5 students by number of entries',
      barChartLabels: labels,
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
      maxValue: this.getMaxValue(barChartData),
      displayLabel: false
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
      title: 'Topics per Course',
      subtitle: 'Number of topics created per course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
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
      title: 'Topics Over Time',
      subtitle: 'Find the peak of creation',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line',
      barChartLegend: true,
      height: '20vh',
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
      title: 'Topic States Distribution',
      subtitle: 'Track distribution state',
      barChartLabels: labels.length > 0 ? labels : ['No Data'],
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '25vh',
      width: '100%',
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
      title: 'Topics by User',
      subtitle: 'Top 5 posting frequency',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
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
      subtitle: 'Number of enrollment per course',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '50vh',
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
      subtitle: 'Comparison of topics posted by students vs teachers',
      barChartLabels: ['Students', 'Teachers'],
      barChartData,
      barChartType: 'bar',
      barChartLegend: true,
      height: '20vh',
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
      subtitle: 'Comparison of entries posted by students vs teachers',
      barChartLabels: ['Students', 'Teachers'],
      barChartData,
      barChartType: 'pie',
      barChartLegend: true,
      height: '25vh',
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
      title: 'Entries Over Time',
      subtitle: 'Number of entries created per month',
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData,
      barChartType: 'line', // You can change this to 'bar' if preferred
      barChartLegend: true,
      height: '20vh',
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
}
