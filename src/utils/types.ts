// 解析模板页面顺序（order）
export function parseOrderFromPreviewKey(previewKey: string): number {
  // 例：template_pre_5_4.svg，返回4
  const match = /template_pre_\d+_(\d+)\.svg$/.exec(previewKey);
  return match ? parseInt(match[1], 10) : 1;
}

export const toStatusTemplate = (tpl: baseType.Template): statusType.Template => {
  return {
    ...tpl,
    pages: tpl.pages.map((p: baseType.Page): statusType.TemplatePage => toStatusTemplatePage(p)),
  };
};

export const toStatusTemplatePage = (page: baseType.Page): statusType.TemplatePage => {
  const order: number = page.preview_oss_key ? parseOrderFromPreviewKey(page.preview_oss_key) : 1;
  // 如果一共有 5 页，封面页的 order 是 1，介绍页的 order 是 2，3，内容页的 order 是 4，封底页的 order 是 5
  // 就是说，封面、内容、封底各只有一页，介绍页可以有多页
  return {
    ...page,
    order,
    type: page.is_content_page ? 'content' : (order === 1 ? 'cover' : 'end'),
    url: '', // 需通过 oss_key 获取
  };
};

export const toStatusPage = (page: baseType.Page, projectId: string): statusType.PortfolioPage => {
  const order: number = page.preview_oss_key ? parseOrderFromPreviewKey(page.preview_oss_key) : 1;
  const type: string = page.is_content_page ? 'content' : (order === 1 ? 'cover' : 'end');
  return {
    pageNum: order,
    order: order,
    type: type as "content" | "cover" | "resume" | "end",
    projectId,
    previewUrl: '',
  };
};

export const toStatusProject = (project: baseType.Project, template: baseType.Template): statusType.Project => {
  // 只读项目判断
  const readonly: boolean = project.name === '封面与介绍' || project.name === '封底';
  // pages: 非内容页项目用模板的非内容页，内容页项目用内容页模板
  let pages: statusType.PortfolioPage[] = [];
  if (readonly) {
    // 非内容页项目
    const page = template.pages.find((p: baseType.Page): boolean => !p.is_content_page);
    if (page) pages = [toStatusPage(page, project.uid)];
  } else {
    // 内容页项目
    const contentTplPage = template.pages.find((p: baseType.Page): boolean => p.is_content_page);
    if (contentTplPage) pages = [toStatusPage(contentTplPage, project.uid)];
  }
  return {
    ...project,
    hidden: false,
    readonly,
    pages,
    works: (project.works || []).map((w: baseType.Work): statusType.Work => toStatusWork(w)),
    texts: (project.texts || []).map((t: baseType.Text): statusType.Text => toStatusText(t)),
    is_content_project: readonly ? false : true,
    // template: toStatusTemplate(template),
  };
};

export const toStatusWork = (work: baseType.Work): statusType.Work => {
  return {
    ...work,
    url: '', // 需后续通过 oss_key 获取
  };
};

export const toStatusText = (text: baseType.Text): statusType.Text => {
  return {
    ...text,
  };
};

export const toStatusPortfolio = (portfolio: baseType.Portfolio): statusType.Portfolio => {
  return {
    ...portfolio,
    projects: (portfolio.projects || []).map((p: baseType.Project): statusType.Project => toStatusProject(p, portfolio.template)),
    template: toStatusTemplate(portfolio.template),
  };
};

export const parseSize = (size: string): { width: string; height: string } => {
  const [width, height] = size.split('x');
  return { width, height };
}