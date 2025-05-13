
import { request } from './request';
/**
 * Saves a portfolio.
 * POST /api/portfolio/portfolio/save
 * @param payload - The portfolio data to save.
 */
export const savePortfolio = (payload: apiType.SavePortfolioRequest) => {
  return request<apiType.SavePortfolioResponse['data']>({ // Specify the expected data type
    url: '/portfolio/portfolio/save',
    method: 'POST',
    data: payload,
  });
};

/**
 * Fetches the current user's portfolios.
 * GET /api/portfolio/portfolio/me
 */
export const getMyPortfolios = () => {
  return request<apiType.GetMyPortfolioResponse['data']>({ // Specify the expected data type
    url: '/portfolio/portfolio/me',
    method: 'GET',
  });
};

/**
 * Fetches the current user's historically used templates.
 * GET /api/portfolio/portfolio/history
 */
export const getHistoryTemplates = () => {
  return request<apiType.GetHistoryTemplatesResponse['data']>({ // Specify the expected data type
    url: '/portfolio/portfolio/history',
    method: 'GET',
  });
};
