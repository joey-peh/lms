import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { EnrollmentDetails, TopicDetails, LoginUser, AppState } from '../../models/lms-models';

const LMSActionGroup = createActionGroup({
  source: 'LMS',
  events: {
    'Load Data': emptyProps(),
    'Load Data Success': props<{ state: AppState }>(),
    'Load Data Failure': props<{ error: string }>(),
    'Delete Enrollment': props<{ enrollment: EnrollmentDetails }>(),
    'Delete Enrollment Success': props<{ enrollment: EnrollmentDetails }>(),
    'Delete Topic': props<{ topic: TopicDetails }>(),
    'Delete Topic Success': props<{ topic: TopicDetails }>(),
    'Set Current User': props<{ user: LoginUser | null }>(),
    'Reset State': emptyProps(),
  },
});

export const LoadData = LMSActionGroup.loadData;
export const LoadDataSuccess = LMSActionGroup.loadDataSuccess;
export const LoadDataFailure = LMSActionGroup.loadDataFailure;
export const DeleteEnrollment = LMSActionGroup.deleteEnrollment;
export const DeleteEnrollmentSuccess = LMSActionGroup.deleteEnrollmentSuccess;
export const DeleteTopic = LMSActionGroup.deleteTopic;
export const DeleteTopicSuccess = LMSActionGroup.deleteTopicSuccess;
export const SetCurrentUser = LMSActionGroup.setCurrentUser;
export const ResetState = LMSActionGroup.resetState;