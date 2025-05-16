import {parseOrderFromPreviewKey, toStatusPage, toStatusTemplate} from "../utils/types";
import { getTemplateDetails } from '@/api/template';
import { getSignedPreviewUrl } from '@/api/oss';
import { parseSize } from "../utils/types";
import { parseSvgDimensions } from '@/utils/common';

// 获取模板详细数据并返回 statusType.Template（含页面 order/type/url 字段）
export async function getTemplateDetailWithUrl(templateId: string): Promise<statusType.Template> {
  const template = await getTemplateDetails(templateId);
  console.log("[getTemplateDetailWithUrl] template: ", template);
  const total = template.pages.length;
  const pages: statusType.TemplatePage[] = await Promise.all(
    template.pages.map(async (p: baseType.Page) => {
      const order = p.preview_oss_key ? parseOrderFromPreviewKey(p.preview_oss_key) : 1;
      let type: 'cover' | 'resume' | 'content' | 'end';
      if (order === 1) type = 'cover';
      else if (order === total) type = 'end';
      else if (order === total - 1) type = 'content';
      else type = 'resume';
      const previewUrl = p.preview_oss_key ? await getSignedPreviewUrl(p.preview_oss_key) : '';
      const nowTime = Date.now();
      // 已有url，根据 get url 的响应获取宽高
      let width: string = "";
      let height: string = "";
      try {
        const svgText = await getSvgContent(previewUrl);
        const svgDimensions = parseSvgDimensions(svgText);
        const dimensions = {
          width: svgDimensions.width !== null ? svgDimensions.width : 0,
          height: svgDimensions.height !== null ? svgDimensions.height : 0
        };
        width = svgDimensions.width !== null ? String(svgDimensions.width) : "";
        height = svgDimensions.height !== null ? String(svgDimensions.height) : "";
        console.log('图片尺寸：', dimensions.width, 'x', dimensions.height);
      } catch (error) {
        console.error('获取图片尺寸失败：', error);
      }

      return {
        ...p,
        order,
        type,
        width,
        height,
        containerWidth: parseInt(parseSize(p.size).width),
        containerHeight: parseInt(parseSize(p.size).height),
        url: previewUrl,
        expireTime: String(nowTime + 29 * 60 * 1000),
      };
    })
  );
  return {
    ...template,
    pages,
    contentPage: pages.find((p: baseType.Page) => p.is_content_page) || {} as statusType.TemplatePage,
  };
}

async function getSvgContent(url: string): Promise<string> {
  console.log('[getSvgContent] Requesting URL (raw):', url);
  try {
    const requestOptions = {
      url,
      method: 'GET' as const,
      responseType: 'text' as const,
      dataType: 'text' as const, 
      header: {
        // Minimal headers, let uni.request and the environment handle defaults
        // We are testing if adding x-oss-content-sha256 was problematic
        // or if other default headers from uni-app were interfering.
      },
    };
    console.log('[getSvgContent] Request options (minimal headers):', JSON.stringify(requestOptions));

    const res = await uni.request(requestOptions);

    console.log('[getSvgContent] Response status:', res.statusCode);
    console.log('[getSvgContent] Response headers:', JSON.stringify(res.header));

    if (res.statusCode !== 200) {
      let errorData = res.data;
      if (typeof errorData === 'object') {
        errorData = JSON.stringify(errorData);
      }
      if (typeof errorData === 'string' && errorData.length > 500) { // Limit log size
        errorData = errorData.substring(0, 500) + '...';
      }
      console.error('[getSvgContent] Error response data:', errorData);
      throw new Error(`获取 svg 请求错误，状态码: ${res.statusCode}`);
    }
    
    return res.data as string;
  } catch (error) {
    console.error('获取SVG失败:', error);
    return '';
  }
}

export function initProjectsFromStatusTemplate(
  template: statusType.Template,
  groups: { name: string; order: number }[],
  portfolioUid: string = ''
): statusType.Project[] {
  const coverPages = template.pages.filter((p: statusType.TemplatePage) => p.type === 'cover' || p.type === 'resume');
  const endPages = template.pages.filter((p: statusType.TemplatePage) => p.type === 'end');
  const contentTplPage = template.pages.find((p: statusType.TemplatePage) => p.type === 'content');
  const coverProject: statusType.Project = {
    uid: 'cover',
    name: '封面与介绍',
    order: 0,
    hidden: false,
    readonly: true,
    portfolio_uid: portfolioUid,
    pages: coverPages.map((p) => ({
      pageNum: p.order,
      order: p.order,
      type: p.type,
      projectId: 'cover',
      bkgUrl: p.url,
    })),
    works: [],
    texts: [],
    is_content_project: false,
  };
  const endProject: statusType.Project = {
    uid: 'end',
    name: '封底',
    order: 100,
    hidden: false,
    readonly: true,
    portfolio_uid: portfolioUid,
    pages: endPages.map(p => ({
      pageNum: 1,
      order: p.order,
      type: p.type,
      projectId: 'end',
      bkgUrl: p.url
    })),
    works: [],
    texts: [],
    is_content_project: false,
  };
  // 每个分组新建一个内容页项目
  const groupProjects: statusType.Project[] = (
    groups && groups.length ? groups : [{ name: '默认项目', order: 1 }]
  ).map((g, idx) => ({
    uid: `${portfolioUid}_group_${idx}`,
    name: g.name,
    order: 1,
    hidden: false,
    readonly: false,
    portfolio_uid: portfolioUid,
    pages: contentTplPage ? [{
      pageNum: contentTplPage.order,
      order: contentTplPage.order,
      type: contentTplPage.type,
      projectId: `${portfolioUid}_group_${idx}`,
      bkgUrl: contentTplPage.url
    }] : [],
    works: [],
    texts: [],
    is_content_project: true,
  }));
  return [coverProject, ...groupProjects, endProject];
}
