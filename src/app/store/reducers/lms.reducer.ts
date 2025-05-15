import { createReducer, on } from '@ngrx/store';
import { AppState, Enrollment, Topic } from '../../models/lms-models';
import {
  loadData,
  loadDataSuccess,
  loadDataFailure,
  deleteEnrollmentSuccess,
  deleteTopicSuccess,
  setCurrentUser,
  resetState,
} from '../actions/lms.actions';

export const initialState: AppState = {
  courses: [],
  users: [],
  enrollments: [],
  topics: [],
  entries: [],
  loading: false,
  error: null,
  currentUser: null,
};

export const lmsReducer = createReducer(
  initialState,
  on(loadData, (state) => ({ ...state, loading: true, error: null })),
  on(loadDataSuccess, (state, { state: newState }) => ({
    ...state,
    ...newState,
    loading: false,
    error: null,
  })),
  on(loadDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(deleteEnrollmentSuccess, (state, { enrollment }) => ({
    ...state,
    enrollments: state.enrollments.map((e) =>
      e.user_id === enrollment.user_id && e.course_id === enrollment.course_id
        ? ({ ...e, enrollment_state: 'deleted' } as Enrollment)
        : e
    ),
  })),
  on(deleteTopicSuccess, (state, { topic }) => ({
    ...state,
    topics: state.topics.map((t) =>
      t.topic_id === topic.topic_id
        ? ({ ...t, topic_state: 'deleted' } as Topic)
        : t
    ),
  })),
  on(setCurrentUser, (state, { user }) => ({
    ...state,
    currentUser: user,
  })),
  on(resetState, () => initialState)
);
