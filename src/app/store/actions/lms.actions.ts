import { createAction, props } from '@ngrx/store';
import { EnrollmentDetails, TopicDetails, LoginUser, LmsState } from '../../models/lms-models';

// Load Data Actions
export const loadData = createAction('[LMS] Load Data');
export const loadDataSuccess = createAction(
  '[LMS] Load Data Success',
  props<{ state: LmsState }>()
);
export const loadDataFailure = createAction(
  '[LMS] Load Data Failure',
  props<{ error: string }>()
);

// Delete Enrollment Actions
export const deleteEnrollment = createAction(
  '[LMS] Delete Enrollment',
  props<{ enrollment: EnrollmentDetails }>()
);
export const deleteEnrollmentSuccess = createAction(
  '[LMS] Delete Enrollment Success',
  props<{ enrollment: EnrollmentDetails }>()
);

// Delete Topic Actions
export const deleteTopic = createAction(
  '[LMS] Delete Topic',
  props<{ topic: TopicDetails }>()
);
export const deleteTopicSuccess = createAction(
  '[LMS] Delete Topic Success',
  props<{ topic: TopicDetails }>()
);

// Set Current User Actions
export const setCurrentUser = createAction(
  '[LMS] Set Current User',
  props<{ user: LoginUser | null }>()
);

// Reset State Action
export const resetState = createAction('[LMS] Reset State');