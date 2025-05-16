import { inject, Injectable } from '@angular/core';
import { ChartDataset } from 'chart.js';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CommonChart, EnrollmentDetails
} from '../models/lms-models';
import { LmsSandboxService } from '../store/sandbox/lms-sandbox-service';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  private readonly sandbox = inject(LmsSandboxService);

  private getDynamicVh(referenceHeight: number = 288): string {
    const vh = (referenceHeight / window.innerHeight) * 100;
    return `${vh.toFixed(2)}vh`;
  }

  private getMaxValue(datasets: ChartDataset[]): number {
    const values = datasets
      .flatMap((dataset) => dataset.data as number[])
      .filter((val) => val > 0);
    return values.length ? Math.ceil(Math.max(...values) * 1.2) : 1;
  }

  private getTop5SortedLabelsAndCounts(
    data: Record<string, number>,
    mapKeyToLabel: (key: string) => string
  ): { labels: string[]; counts: number[] } {
    const sorted = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    return {
      labels: sorted.map(([key]) => mapKeyToLabel(key)).filter(Boolean),
      counts: sorted.map(([, count]) => count),
    };
  }

  private getRole(
    userId: string,
    users: EnrollmentDetails[]
  ): 'student' | 'teacher' | null {
    const user = users.find((u) => u.user_id.toString() === userId);
    return user?.enrollment_type?.toLowerCase() as 'student' | 'teacher' | null;
  }

  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr || dateStr === 'N/A') return null;
    const match = dateStr.match(
      /^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/
    );
    if (!match) return null;

    const [, day, month, year, hour, minute, second, period] = match;
    let h = parseInt(hour, 10);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    const isoDate = `${year}-${month}-${day}T${h
      .toString()
      .padStart(2, '0')}:${minute}:${second}`;
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatMonthYear(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
  }

  private formatDateLabel(date: Date): string {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  private createChart({
    title,
    subtitle,
    labels,
    datasets,
    type = 'bar',
    legend = true,
    displayLabel = true,
  }: {
    title: string;
    subtitle: string;
    labels: string[];
    datasets: ChartDataset[];
    type?: CommonChart['barChartType'];
    legend?: boolean;
    displayLabel?: boolean;
  }): CommonChart {
    return {
      title,
      subtitle,
      barChartLabels: labels.length ? labels : ['No Data'],
      barChartData: datasets.length
        ? datasets
        : [{ data: [0], label: 'No Data' }],
      barChartType: type,
      barChartLegend: legend,
      height: this.getDynamicVh(),
      maxValue: this.getMaxValue(datasets),
      displayLabel,
    };
  }

  getEntriesPerCourse(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getCourses(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, courses, users]) => {
        const studentData: Record<string, number> = {};
        const teacherData: Record<string, number> = {};

        topics.forEach((topic) => {
          const courseId = topic.course_id.toString();
          topic.entries.forEach((entry) => {
            const userId = entry.entry_posted_by_user_id.toString();
            const role = this.getRole(userId, users);
            if (role === 'student') {
              studentData[courseId] = (studentData[courseId] || 0) + 1;
            } else if (role === 'teacher') {
              teacherData[courseId] = (teacherData[courseId] || 0) + 1;
            }
          });
        });

        const courseIdToName = (id: string) =>
          courses.find((c) => c.course_id.toString() === id)?.course_name ?? '';

        const { labels, counts: studentCounts } =
          this.getTop5SortedLabelsAndCounts(studentData, courseIdToName);

        const teacherCounts = labels.map((label) => {
          const courseId = Object.keys(teacherData).find(
            (id) => courseIdToName(id) === label
          );
          return courseId ? teacherData[courseId] || 0 : 0;
        });

        const datasets: ChartDataset[] = [
          {
            data: studentCounts,
            label: 'Entries by Students',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            data: teacherCounts,
            label: 'Entries by Teachers',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ];

        return this.createChart({
          title: 'Entries per Course by Role',
          subtitle:
            'Breaks down entries by students versus instructors for each course.',
          labels,
          datasets,
        });
      })
    );
  }

  getEntriesByStudent(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, users]) => {
        const studentIds = new Set(
          users
            .filter((u) => u.enrollment_type?.toLowerCase() === 'student')
            .map((u) => u.user_id.toString())
        );
        const data = topics
          .flatMap((t) => t.entries)
          .reduce((acc: Record<string, number>, entry) => {
            const userId = entry.entry_posted_by_user_id.toString();
            if (studentIds.has(userId)) {
              acc[userId] = (acc[userId] || 0) + 1;
            }
            return acc;
          }, {});

        const { labels, counts } = this.getTop5SortedLabelsAndCounts(
          data,
          (userId) =>
            users.find((u) => u.user_id.toString() === userId)?.user
              .user_name ?? ''
        );

        return this.createChart({
          title: 'Top 5 Students by Entry Count',
          subtitle:
            'Identifies the top five students based on the number of entries.',
          labels,
          datasets: [
            {
              data: counts,
              label: 'Student Entries',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
      })
    );
  }

  getDiscussionActivityOverTime(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      map((topics) => {
        const activityByDate = topics
          .flatMap((t) => t.entries)
          .reduce((acc: Record<string, number>, entry) => {
            const date = this.parseDate(entry.entry_created_at);
            if (date) {
              const dateKey = `${date.getFullYear()}-${
                date.getMonth() + 1
              }-${date.getDate()}`;
              acc[dateKey] = (acc[dateKey] || 0) + 1;
            }
            return acc;
          }, {});

        const sortedDates = Object.keys(activityByDate).sort();
        const labels = sortedDates;
        const data = sortedDates.map((key) => activityByDate[key]);

        return this.createChart({
          title: 'Discussion Activity Trends',
          subtitle:
            'Tracks the number of posts over time, revealing patterns and peaks.',
          labels,
          datasets: [
            {
              data,
              label: 'Discussion Activity',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1,
            },
          ],
          type: 'line',
        });
      })
    );
  }

  getEngagementByCourse(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getCourses(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, courses, users]) => {
        const engagementData: Record<string, Record<string, number>> = {};
        topics.forEach((topic) => {
          const courseId = topic.course_id.toString();
          engagementData[courseId] = engagementData[courseId] || {};
          topic.entries.forEach((entry) => {
            const studentId = entry.entry_posted_by_user_id.toString();
            engagementData[courseId][studentId] =
              (engagementData[courseId][studentId] || 0) + 1;
          });
        });

        const courseIdToName = (id: string) =>
          courses.find((c) => c.course_id.toString() === id)?.course_name ?? '';
        const userIdToName = (id: string) =>
          users.find((u) => u.user_id.toString() === id)?.user.user_name ?? '';

        const totalByStudent = Object.keys(engagementData).reduce(
          (acc: Record<string, number>, courseId) => {
            Object.entries(engagementData[courseId]).forEach(
              ([studentId, count]) => {
                acc[studentId] = (acc[studentId] || 0) + count;
              }
            );
            return acc;
          },
          {}
        );

        const topStudentIds = Object.entries(totalByStudent)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([studentId]) => studentId);

        const labels = Object.keys(engagementData)
          .map(courseIdToName)
          .filter(Boolean);
        const datasets: ChartDataset[] = topStudentIds.map(
          (studentId, index) => ({
            data: Object.keys(engagementData).map(
              (courseId) => engagementData[courseId][studentId] || 0
            ),
            label: userIdToName(studentId),
            backgroundColor: `rgba(${(index * 50) % 255}, 162, ${
              (index * 100) % 255
            }, 0.2)`,
            borderColor: `rgba(${(index * 50) % 255}, 162, ${
              (index * 100) % 255
            }, 1)`,
            borderWidth: 1,
          })
        );

        return this.createChart({
          title: 'Engagement by Course',
          subtitle:
            'Showcases the top five students by entry count across courses.',
          labels,
          datasets,
          displayLabel: false,
        });
      })
    );
  }

  getTopicsPerCourse(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getCourses(),
      this.sandbox.getTopicDetails(),
    ]).pipe(
      map(([courses, topics]) => {
        const countTopicsByState = (state: 'active' | 'inactive') =>
          topics
            .filter((t) =>
              state === 'active'
                ? t.topic_state === 'active'
                : t.topic_state !== 'active'
            )
            .reduce((acc: Record<string, number>, t) => {
              const courseId = t.course_id.toString();
              acc[courseId] = (acc[courseId] || 0) + 1;
              return acc;
            }, {});

        const activeData = countTopicsByState('active');
        const inactiveData = countTopicsByState('inactive');
        const courseIdToName = (id: string) =>
          courses.find((c) => c.course_id.toString() === id)?.course_name ?? '';

        const { labels, counts: activeCounts } =
          this.getTop5SortedLabelsAndCounts(activeData, courseIdToName);
        const inactiveCounts = labels.map((label) => {
          const courseId = Object.keys(inactiveData).find(
            (id) => courseIdToName(id) === label
          );
          return courseId ? inactiveData[courseId] || 0 : 0;
        });

        const datasets: ChartDataset[] = [
          {
            data: activeCounts,
            label: 'Active Topics',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            data: inactiveCounts,
            label: 'Inactive Topics',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ];

        return this.createChart({
          title: 'Course Topic Overview',
          subtitle: 'View the number of topics created for each course.',
          labels,
          datasets,
        });
      })
    );
  }

  getTopicsOverTime(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      map((topics) => {
        const countsByMonth = topics.reduce(
          (
            acc: {
              active: Record<string, number>;
              inactive: Record<string, number>;
            },
            topic
          ) => {
            const date = this.parseDate(topic.topic_created_at);
            if (date) {
              const monthYear = this.formatMonthYear(date);
              const target =
                topic.topic_state === 'active' ? acc.active : acc.inactive;
              target[monthYear] = (target[monthYear] || 0) + 1;
            }
            return acc;
          },
          { active: {}, inactive: {} }
        );

        const allMonths = Array.from(
          new Set([
            ...Object.keys(countsByMonth.active),
            ...Object.keys(countsByMonth.inactive),
          ])
        ).sort();
        const activeCounts = allMonths.map(
          (key) => countsByMonth.active[key] || 0
        );
        const inactiveCounts = allMonths.map(
          (key) => countsByMonth.inactive[key] || 0
        );

        return this.createChart({
          title: 'Topic Creation Trends',
          subtitle: 'Analyze topic creation over time to pinpoint peaks.',
          labels: allMonths.map((month) => {
            const [year, monthNum] = month.split('-').map(Number);
            return this.formatDateLabel(new Date(year, monthNum - 1));
          }),
          datasets: [
            {
              data: activeCounts,
              label: 'Active Topics',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1,
            },
            {
              data: inactiveCounts,
              label: 'Inactive Topics',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1,
            },
          ],
          type: 'line',
        });
      })
    );
  }

  getTopicStatesDistribution(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      map((topics) => {
        const stateCounts = {
          active: topics.filter((t) => t.topic_state === 'active').length,
          unpublished: topics.filter((t) => t.topic_state === 'unpublished')
            .length,
          deleted: topics.filter((t) => t.topic_state === 'deleted').length,
        };

        const filtered = Object.entries(stateCounts)
          .filter(([, count]) => count > 0)
          .map(([label, count]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            count,
          }));

        const labels = filtered.map((item) => item.label);
        const data = filtered.map((item) => item.count);

        return this.createChart({
          title: 'Topic Status Distribution',
          subtitle: 'Monitor the distribution of topic states.',
          labels,
          datasets: [
            {
              data,
              label: 'Topics',
              backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(75, 192, 192, 0.2)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(75, 192, 192, 1)',
              ],
              borderWidth: 1,
            },
          ],
          type: 'pie',
        });
      })
    );
  }

  getTopicsPerUser(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getEnrollmentDetails(),
      this.sandbox.getTopicDetails(),
    ]).pipe(
      map(([users, topics]) => {
        const userIdToName = new Map(
          users.map((u) => [u.user_id.toString(), u.user.user_name])
        );
        const countTopicsByState = (state: 'active' | 'inactive') =>
          topics
            .filter((t) =>
              state === 'active'
                ? t.topic_state === 'active'
                : t.topic_state !== 'active'
            )
            .reduce((acc: Record<string, number>, t) => {
              const userId = t.topic_posted_by_user_id.toString();
              acc[userId] = (acc[userId] || 0) + 1;
              return acc;
            }, {});

        const activeData = countTopicsByState('active');
        const inactiveData = countTopicsByState('inactive');
        const mapUserIdToName = (id: string) => userIdToName.get(id) ?? '';

        const { labels, counts: activeCounts } =
          this.getTop5SortedLabelsAndCounts(activeData, mapUserIdToName);
        const inactiveCounts = labels.map((label) => {
          const userId = Object.keys(inactiveData).find(
            (id) => mapUserIdToName(id) === label
          );
          return userId ? inactiveData[userId] || 0 : 0;
        });

        const datasets: ChartDataset[] = [
          {
            data: activeCounts,
            label: 'Active Topics',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            data: inactiveCounts,
            label: 'Inactive Topics',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ];

        return this.createChart({
          title: 'User Posting Activity',
          subtitle: 'Identify the top five users by posting frequency.',
          labels,
          datasets,
        });
      })
    );
  }

  createEnrollmentChartStats(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getCourses(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([courses, enrollments]) => {
        const data = courses.reduce((acc: Record<string, number>, course) => {
          acc[course.course_id.toString()] = enrollments.filter(
            (e) =>
              e.course_id === course.course_id &&
              e.enrollment_state === 'active' &&
              e.enrollment_type === 'student'
          ).length;
          return acc;
        }, {});

        const { labels, counts } = this.getTop5SortedLabelsAndCounts(
          data,
          (courseId) =>
            courses.find((c) => c.course_id.toString() === courseId)
              ?.course_name ?? ''
        );

        const datasets: ChartDataset[] = [
          {
            data: counts,
            label: 'Student Enrollments',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ];

        return this.createChart({
          title: 'Student Enrollments by Course',
          subtitle:
            'Displays the number of student enrollments for each course.',
          labels,
          datasets,
        });
      })
    );
  }

  getTopicsByRole(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, users]) => {
        const counts = topics.reduce(
          (acc: { Student: number; Teacher: number }, topic) => {
            const role = this.getRole(
              topic.topic_posted_by_user_id.toString(),
              users
            );
            if (role === 'student') acc.Student++;
            else if (role === 'teacher') acc.Teacher++;
            return acc;
          },
          { Student: 0, Teacher: 0 }
        );

        const labels = ['Students', 'Teachers'];
        const data = [counts.Student, counts.Teacher];

        return this.createChart({
          title: 'Topics by Role',
          subtitle: 'Compares topics created by students versus instructors.',
          labels,
          datasets: [
            {
              data,
              label: 'Topics Created',
              backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)',
              ],
              borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
              borderWidth: 1,
            },
          ],
          type: 'doughnut',
        });
      })
    );
  }

  getEntriesByRole(): Observable<CommonChart> {
    return combineLatest([
      this.sandbox.getTopicDetails(),
      this.sandbox.getEnrollmentDetails(),
    ]).pipe(
      map(([topics, users]) => {
        const counts = topics
          .flatMap((t) => t.entries)
          .reduce(
            (acc: { Student: number; Teacher: number }, entry) => {
              const role = this.getRole(
                entry.entry_posted_by_user_id.toString(),
                users
              );
              if (role === 'student') acc.Student++;
              else if (role === 'teacher') acc.Teacher++;
              return acc;
            },
            { Student: 0, Teacher: 0 }
          );

        const labels = ['Students', 'Teachers'];
        const data = [counts.Student, counts.Teacher];

        return this.createChart({
          title: 'Entries by Role',
          subtitle: 'Analyzes entries posted by students versus instructors.',
          labels,
          datasets: [
            {
              data,
              label: 'Entries Posted',
              backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)',
              ],
              borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
              borderWidth: 1,
            },
          ],
          type: 'doughnut',
        });
      })
    );
  }

  getEntriesOverTime(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      map((topics) => {
        const entriesByMonth = topics
          .flatMap((t) => t.entries)
          .reduce((acc: Record<string, number>, entry) => {
            const date = this.parseDate(entry.entry_created_at);
            if (date) {
              const monthYear = this.formatMonthYear(date);
              acc[monthYear] = (acc[monthYear] || 0) + 1;
            }
            return acc;
          }, {});

        const sortedMonths = Object.keys(entriesByMonth).sort();
        const labels = sortedMonths.map((month) => {
          const [year, monthNum] = month.split('-').map(Number);
          return this.formatDateLabel(new Date(year, monthNum - 1));
        });
        const data = sortedMonths.map((key) => entriesByMonth[key]);

        return this.createChart({
          title: 'Entry Creation Trends',
          subtitle: 'Visualizes the number of entries created per month.',
          labels,
          datasets: [
            {
              data,
              label: 'Entries Over Time',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1,
            },
          ],
          type: 'line',
        });
      })
    );
  }

  createPerCourseEnrollmentTrendChart(): Observable<CommonChart> {
    return this.sandbox.getEnrollmentDetails().pipe(
      map((enrollments) => {
        const enrollmentsByCourseAndMonth: Record<
          number,
          Record<string, number>
        > = {};
        enrollments.forEach((enrollment) => {
          if (
            enrollment.enrollment_state !== 'active' ||
            enrollment.enrollment_type !== 'student'
          )
            return;
          const date = this.parseDate(enrollment.user.user_created_at);
          if (!date) return;

          const monthKey = this.formatMonthYear(date);
          const courseId = enrollment.course.course_id;
          enrollmentsByCourseAndMonth[courseId] =
            enrollmentsByCourseAndMonth[courseId] || {};
          enrollmentsByCourseAndMonth[courseId][monthKey] =
            (enrollmentsByCourseAndMonth[courseId][monthKey] || 0) + 1;
        });

        const allMonths = Array.from(
          new Set(
            Object.values(enrollmentsByCourseAndMonth).flatMap((courseMonths) =>
              Object.keys(courseMonths)
            )
          )
        ).sort();

        const datasets: ChartDataset[] = Object.entries(
          enrollmentsByCourseAndMonth
        )
          .map(([courseId, months]) => {
            const course = enrollments.find(
              (e) => e.course.course_id === parseInt(courseId)
            )?.course;
            if (!course) return null;
            const data = allMonths.map((month) => months[month] || 0);
            return {
              data,
              label: `${course.course_code}: ${course.course_name}`,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              fill: false,
              tension: 0.1,
            } as ChartDataset;
          })
          .filter((d): d is ChartDataset => d !== null);

        const labels = allMonths.map((month) => {
          const [year, monthNum] = month.split('-').map(Number);
          return this.formatDateLabel(new Date(year, monthNum - 1));
        });

        return this.createChart({
          title: 'Per-Course Enrollment Trend',
          subtitle: 'Displays monthly enrollment trends across courses.',
          labels,
          datasets,
          type: 'line',
          displayLabel: false,
        });
      })
    );
  }

  getTopicPopularityChart(): Observable<CommonChart> {
    return this.sandbox.getTopicDetails().pipe(
      map((topics) => {
        const topicData = topics.reduce(
          (acc: Record<string, number>, topic) => {
            acc[topic.topic_id.toString()] = topic.entries.length;
            return acc;
          },
          {}
        );

        const { labels, counts } = this.getTop5SortedLabelsAndCounts(
          topicData,
          (id) =>
            topics.find((t) => t.topic_id.toString() === id)?.topic_title ?? ''
        );

        const datasets: ChartDataset[] = [
          {
            data: counts,
            label: 'Entries per Topic',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ];

        return this.createChart({
          title: 'Topic Popularity by Entry Count',
          subtitle:
            'Displays the number of entries for the top five most active topics.',
          labels,
          datasets,
        });
      })
    );
  }
}
