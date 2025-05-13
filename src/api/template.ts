import { request } from './request';
import { getSignedPreviewUrl } from './oss'; // Import getSignedPreviewUrl
// import { api } from '../types/apiType.d';

// Interface for template data with preview URL
interface TemplateWithPreview extends baseType.Template {
  previewUrl?: string;
}

// Interface for template details with specific page preview URLs
export interface TemplateDetailsWithPagePreviews extends baseType.Template {
  coverPreviewUrl?: string;
  tocPreviewUrl?: string;
  contentPreviewUrl?: string;
}

/**
 * Fetches all available templates.
 * GET /api/portfolio/template/all
 */
export const getAllTemplates = () => {
    return request<apiType.GetAllTemplatesResponse['data']>({ // Specify the expected data type
    url: '/portfolio/template/all',
    method: 'GET',
  });
};

/**
 * Fetches hot templates.
 * GET /api/portfolio/template/hot
 */
export const getHotTemplates = () => {
  // Assuming the endpoint returns data matching GetHotTemplatesResponseItem[]
  // This might already be defined elsewhere, ensure consistency
  return request<apiType.GetHotTemplatesResponse['data']>({
    url: '/portfolio/template/hot', // Replace with actual endpoint
    method: 'GET',
  });
};

/**
 * Fetches detailed information for a specific template.
 * GET /api/template?uid={uid}
 * @param uid - The UID of the template to get.
 */
export const getTemplateDetails = (uid: string) => {
  // Assuming the endpoint returns the full Template structure
  return request<apiType.TemplateDetails['data']>({ // Use the renamed TemplateDetails type
    url: `/portfolio/template?uid=${uid}`, // Replace with actual endpoint
    method: 'GET',
  });
};

// Function to get preview URLs for templates
const getPreviewUrlsForTemplates = async (templates: baseType.Template[] | null | undefined): Promise<TemplateWithPreview[]> => {
  if (!Array.isArray(templates)) {
    console.warn('getPreviewUrlsForTemplates received non-array input:', templates);
    return [];
  }

  const templatesWithUrls = await Promise.all(
    templates.map(async (template) => {
      let previewUrl = '/static/images/template1.png'; // Default placeholder
      const ossKey = template.pages?.[0]?.oss_key;
      if (ossKey) {
        try {
          previewUrl = await getSignedPreviewUrl(ossKey);
        } catch (urlError) {
          console.error(`Failed to get preview URL for template ${template.uid} (key: ${ossKey}):`, urlError);
          // Keep the default placeholder URL on error
        }
      } else {
        console.warn(`No oss_key found for cover page of template ${template.uid}`);
      }
      return { ...template, previewUrl };
    })
  );
  return templatesWithUrls;
};

/**
 * Fetches hot templates with their preview URLs.
 */
export const getHotTemplatesWithPreview = async (): Promise<TemplateWithPreview[]> => {
  const hotData = await getHotTemplates();
  return getPreviewUrlsForTemplates(hotData);
};

/**
 * Fetches all templates with their preview URLs.
 */
export const getAllTemplatesWithPreview = async (): Promise<TemplateWithPreview[]> => {
  const allData = await getAllTemplates();
  return getPreviewUrlsForTemplates(allData);
};

/**
 * Fetches detailed information for a specific template along with its page preview URLs.
 * @param uid - The UID of the template to get.
 */
export const getTemplateDetailsWithPagePreviews = async (uid: string): Promise<TemplateDetailsWithPagePreviews> => {
  const templateDetails = await getTemplateDetails(uid);

  if (!templateDetails || !templateDetails.pages) {
    throw new Error('Template details or pages not found.');
  }

  let coverPreviewUrl = '/static/images/template1.png'; // Default placeholder
  let tocPreviewUrl = '/static/images/template2.png'; // Default placeholder
  let contentPreviewUrl = '/static/images/template1.png'; // Default placeholder for content page

  try {
    // Cover Page (assuming index 0)
    const coverKey = templateDetails.pages[0]?.oss_key;
    if (coverKey) {
      coverPreviewUrl = await getSignedPreviewUrl(coverKey);
    }

    // TOC Page (assuming index 1)
    const tocKey = templateDetails.pages[1]?.oss_key;
    if (tocKey) {
      tocPreviewUrl = await getSignedPreviewUrl(tocKey);
    }

    // Content Page (find first content page)
    const contentPage = templateDetails.pages.find(p => p.is_content_page);
    const contentKey = contentPage?.oss_key;
    if (contentKey) {
      contentPreviewUrl = await getSignedPreviewUrl(contentKey);
    }
  } catch (urlError) {
    console.error(`Failed to get some page preview URLs for template ${uid}:`, urlError);
    // We still return details even if some URLs fail, with defaults
  }

  return {
    ...templateDetails,
    coverPreviewUrl,
    tocPreviewUrl,
    contentPreviewUrl,
  };
};
