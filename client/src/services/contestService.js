import apiClient from '../lib/apiClient';
import { unwrapApiData } from '../lib/apiResponse';

export const contestService = {
  async getUpcomingContests() {
    return unwrapApiData(await apiClient.get('/contests/upcoming'));
  },
};
