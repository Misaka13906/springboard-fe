import { request } from './request';
import type { AddFeedbackRequest, ApiResponse } from '../types/api';

/**
 * Adds new feedback.
 * POST /api/feedback/add
 */
export const addFeedback = (data: AddFeedbackRequest): Promise<ApiResponse<null>> => {
  return request<ApiResponse<null>>({
    url: '/feedback/add',
    method: 'POST',
    data,
  });
};

// Potentially add other feedback-related API functions here later
// e.g., getFeedbackList, updateFeedbackStatus etc.
