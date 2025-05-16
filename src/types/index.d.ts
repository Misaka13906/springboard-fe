declare namespace baseType {
  /**
   * Represents the status of feedback.
   * Pending = 0, Approved = 1, Rejected = 2
   */
  type FeedbackStatus = 0 | 1 | 2;

  /**
   * Feedback data structure.
   * Matches Go: data.Feedback
   */
  interface Feedback {
    uid: string;
    content: string;
    timestamp: string; // Go: time.Time
    status: FeedbackStatus;
  }

  /**
   * Work data structure (e.g., an image within a project).
   * Matches Go: data.Work
   */
  interface Work {
    id?: number;
    uid: string;
    project_uid: string;
    oss_key: string;
    size: string; // Format: "axb", e.g., "1920x1080"
    margin_top: string;
    margin_left: string;
    scale: number;
    page_num: number;
    CreatedAt?: string;
    UpdatedAt?: string;
  }

  /**
   * Text data structure.
   * Matches Go: data.Text
   */
  interface Text {
    id?: number;
    uid: string;
    project_uid: string;
    content: string;
    font_size: string;
    size: string; // Format: "axb"
    margin_top: string;
    margin_left: string;
    page_num: number;
  }

  /**
   * Page data structure (part of a Template).
   * Matches Go: data.Page
   */
  interface Page {
    id?: number;
    uid: string;
    template_uid: string;
    oss_key: string;
    preview_oss_key: string;
    bleed: string[];
    margin_top: string;
    margin_left: string;
    size: string; // Format: "axb"
    is_content_page: boolean;
  }

  /**is_content_page: boolean;

   * Project data structure (a group of works within a portfolio).
   * Matches Go: data.Project
   */
  interface Project {
    id?: number;
    uid: string;
    portfolio_uid: string;
    name: string;
    order: number;
    works: Work[];
    texts: Text[];
    CreatedAt?: string;
    UpdatedAt?: string;
  }

  /**
   * Template data structure.
   * Matches Go: data.Template
   */
  interface Template {
    id?: number;
    uid: string;
    name: string;
    font_oss_key: string;
    pages: Page[];
    CreatedAt?: string;
  }

  /**
   * Portfolio data structure.
   * Matches Go: data.Portfolio
   */
  interface Portfolio {
    id?: number;
    uid: string;
    openid: string;
    title: string;
    projects: Project[];
    template_uid: string;
    template: Template;
    CreatedAt?: string;
    UpdatedAt?: string;
  }
}





declare namespace apiType {
  interface ApiResponse<T = any> {
    code: number; // Business status code, 200 means success
    msg: string; // Response message
    data: T; // Response data payload
  }

  type ApiResult<T> = ApiResponse<T>;

  interface SavePortfolioRequest {
    uid: string; // Portfolio UID. Empty string for first save.
    title: string;
    template_uid: string;
    projects: Omit<baseType.Project, 'ID' | 'CreatedAt' | 'UpdatedAt' | 'portfolio_uid' | 'works'> & {
      works: Omit<baseType.Work, 'ID' | 'CreatedAt' | 'UpdatedAt' | 'project_uid'>[];
    }[];
  }

  interface SavePortfolioResponseData {
    projects: baseType.Project[]; // Includes backend-generated fields like ID, UID, CreatedAt, etc.
    uid: string; // The portfolio UID (new or existing)
  }
  type SavePortfolioResponse = ApiResult<SavePortfolioResponseData>;

  type GetAllTemplatesResponse = ApiResult<baseType.Template[]>;
  type GetHotTemplatesResponse = ApiResult<baseType.Template[]>;

  interface GetMyPortfolioResponseItem extends baseType.Portfolio {}
  type GetMyPortfolioResponse = ApiResult<GetMyPortfolioResponseItem[]>;

  interface GetHistoryTemplatesResponseItem {
    uid: string;
    name: string;
    oss_key: string;
    CreatedAt: string;
  }
  type GetHistoryTemplatesResponse = ApiResult<GetHistoryTemplatesResponseItem[]>;

  type GetAllFeedbacksResponse = ApiResult<baseType.Feedback[]>;
  type GetFeedbacksByStatusResponse = ApiResult<baseType.Feedback[]>;

  interface AddFeedbackRequest {
    content: string;
  }
  type AddFeedbackResponse = ApiResult<null>;

  interface UpdateFeedbackStatusRequest {
    uid: string;
    status: baseType.FeedbackStatus;
  }
  type UpdateFeedbackResponse = ApiResult<null>;

  interface GetCredentialsResponseData {
    AccessKeyId: string;
    AccessKeySecret: string;
    SecurityToken: string;
  }
  type GetCredentialsResponse = ApiResult<GetCredentialsResponseData>;

  interface AppRegisterRequest {
    username: string;
    password: string;
  }
  type AppRegisterResponse = ApiResult<null>;

  interface AppLoginRequest {
    username: string;
    password: string;
  }
  type AppLoginResponse = ApiResult<LoginResponseData>;

  interface LoginResponseData {
    access_token: string;
    refresh_token: string; // Added refresh token
  }
  type LoginResponse = ApiResult<LoginResponseData>;

  interface RefreshTokenResponseData {
    access_token: string;
  }
  type RefreshTokenResponse = ApiResult<RefreshTokenResponseData>;
  type TemplateDetails = ApiResult<baseType.Template>
}



declare namespace statusType {
  type OssImage = {
    width: string;
    height: string; // Image dimensions
    oss_key: string; // OSS key for the image
    url: string; // Image URL
    expireTime: string; // timestamp of the expiration time
    // refresher: (string) => Promise<string>; // Function to refresh the URL
  };

  // 作品集模板类型
  type Template = baseType.Template & {
    pages: TemplatePage[]; // 替换 baseType.Template 的 pages 类型
    contentPage: TemplatePage; // 内容页模板
  };

  // 模板页面类型
  type TemplatePage = baseType.Page & {
    containerWidth: number;
    containerHeight: number;
    order: number; // 在模板中的顺序
    type: 'cover' | 'resume' | 'content' | 'end'; // 页面类型
  } & OssImage; // 继承图片类型

  // 页面类型（作品集中的页面）
  type PortfolioPage = {
    pageNum: number; // 项目内的页码
    order: number; // 对应模板中的页面顺序
    type: 'cover' | 'resume' | 'content' | 'end';
    projectId: string; // 所属项目id
    bkgUrl?: string; // 页面缩略图
  };

  // 项目/分组类型
  type Project = baseType.Project & {
    readonly: boolean; // 是否只读项目
    hidden: boolean;
    is_content_project: boolean; // 是否内容页项目
    pages: PortfolioPage[]; // 该项目下的页面
    works: statusType.Work[]; // 该项目下的作品
    texts: statusType.Text[]; // 该项目下的文本
  };

  // 作品集类型
  type Portfolio = baseType.Portfolio & {
    projects: statusType.Project[]; // 替换 baseType.Portfolio 的 projects 类型
    template: Template; // 添加模板类型
  };

  // 作品图片类型
  type Work = baseType.Work & OssImage;

  // 文本类型
  type Text = baseType.Text;

  interface InitEditStateResult {
    portfolio: statusTypePortfolio;
    currentProjectIndex: number;
    currentPageNum: number;
    preselectPageNum: number | null;
    preselectProjectIndex: number | null;
  }

  type EditStatus = InitEditStateResult & {
  }

  // 预定义常量
  const DEFAULT_COVER_PROJECT: '封面与介绍';
  const DEFAULT_END_PROJECT: '封底';
  const MAX_ORDER: 100;
}


