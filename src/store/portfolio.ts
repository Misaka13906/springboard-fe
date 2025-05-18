import { defineStore } from 'pinia';
import { getTemplateDetails } from '@/api/template';
import { getSignedPreviewUrl, uploadWorkFile, getFileSuffix } from '@/api/oss';
import { getTemplateDetailWithUrl, initProjectsFromStatusTemplate } from '../api/init';
import { ref } from 'vue';
import { savePortfolio as savePortfolioApi } from '@/api/portfolio'; // Import the API function

const LOCAL_KEY = 'portfolio_data';

export const usePortfolioStore = defineStore('portfolio', {
  state: () => ({
    portfolio: null as statusType.Portfolio | null,
    currentProjectIndex: 0,
    currentPageNum: 0,
    preselectPageNum: null as number | null,
    preselectProjectIndex: null as number | null,
    showBleed: false,
    selectedElementUid: null as string | null,
  }),
  actions: {
    async savePortfolio() { // Make it async
      if (this.portfolio) {
        uni.setStorageSync(LOCAL_KEY, JSON.stringify(this.portfolio));
        // Add API call to save to cloud
        try {
          // Construct the payload according to apiType.SavePortfolioRequest
          const payload: apiType.SavePortfolioRequest = {
            uid: this.portfolio.uid,
            title: this.portfolio.title,
            template_uid: this.portfolio.template_uid,
            projects: this.portfolio.projects.map(p => ({
              uid: p.uid,
              name: p.name,
              order: p.order,
              portfolio_uid: this.portfolio?.uid as string,
              works: p.works.map(w => ({
                uid: w.uid,
                project_uid: w.project_uid,
                oss_key: w.oss_key,
                size: w.size,
                margin_top: w.margin_top,
                margin_left: w.margin_left,
                scale: w.scale,
                page_num: w.page_num,
              })),
              texts: p.texts.map(t => ({
                uid: t.uid,
                project_uid: t.project_uid,
                content: t.content,
                font_size: t.font_size,
                font_color: t.font_color,
                size: t.size,
                margin_top: t.margin_top,
                margin_left: t.margin_left,
                page_num: t.page_num,
              })),
            })),
          };
          const response = await savePortfolioApi(payload);
          console.log('Portfolio saved to cloud:', response);
          uni.showToast({ title: '已保存到云端', icon: 'success' });
          // Optionally update local portfolio with response data if UIDs/timestamps change
          if (response && response.uid) {
            this.portfolio.uid = response.uid;
            // Potentially update project UIDs if they are returned and different
          }
        } catch (error) {
          console.error('Failed to save portfolio to cloud:', error);
          uni.showToast({ title: '保存到云端失败', icon: 'none' });
        }
      }
    },
    setSelectedElementUid(uid: string | null) {
      this.selectedElementUid = uid;
    },
    toggleShowBleed() {
      this.showBleed = !this.showBleed;
    },
    setPortfolio(data: statusType.Portfolio) {
      this.portfolio = data;
      this.savePortfolio();
    },
    setCurrentProjectIndex(index: number) {
      this.currentProjectIndex = index;
    },
    setCurrentPageNum(num: number) {
      this.currentPageNum = num;
    },
    setPreselectPageNum(num: number | null) {
      this.preselectPageNum = num;
    },
    setPreselectProjectIndex(index: number | null) {
      this.preselectProjectIndex = index;
    },
    async initEditStateByTemplateId(
      templateId: string,
      groups: { name: string; order: number }[] = [],
      portfolioUid: string = '',
      openid: string = ''
    ) {
      const template: statusType.Template = await getTemplateDetailWithUrl(templateId);
      const projects = initProjectsFromStatusTemplate(template, groups, portfolioUid);
      this.portfolio = {
        uid: portfolioUid,
        title: '我的作品集',
        projects,
        template,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        openid: openid,
        template_uid: template.uid
      };
      this.currentProjectIndex = 0;
      this.currentPageNum = 0;
      this.preselectPageNum = null;
      this.preselectProjectIndex = null;
      console.log("[initEditState]: portfolio: ", this.portfolio)
      this.savePortfolio();
    },
    // 项目相关
    addProject() {
      if (!this.portfolio) return;
      const projects: statusType.Project[] = this.portfolio.projects;
      const maxOrder = 100;
      const endIdx = projects.findIndex(p => p.readonly && p.order === maxOrder);
      const newProject = {
        uid: `uid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        portfolio_uid: this.portfolio.uid || '',
        name: '新项目',
        order: endIdx > 0 ? projects[endIdx-1].order + 1 : 1,
        hidden: false,
        readonly: false,
        pages: [{
          pageNum: 1,
          order: 1,
          type: 'content' as 'content' | 'cover' | 'resume' | 'end',
          projectId: `uid_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          bkgUrl: this.portfolio?.template.contentPage.url,
        }],
        works: [],
        texts: [],
        is_content_project: true,
      };
      projects.splice(endIdx, 0, newProject);
      this.currentProjectIndex = endIdx;
      this.currentPageNum = 0;
      this.savePortfolio();
    },
    removeProject(index: number) {
      if (!this.portfolio) return;
      const projects = this.portfolio.projects;
      if (projects[index].readonly) return;
      if (projects.length <= 3) {
        uni.showToast({ title: '至少保留一个项目', icon: 'none' });
        return;
      }
      projects.splice(index, 1);
      if (this.currentProjectIndex >= projects.length) {
        this.currentProjectIndex = projects.length - 1;
      }
      this.savePortfolio();
    },
    editProjectName({ index, name }: { index: number, name: string }) {
      if (!this.portfolio) return;
      if (this.portfolio.projects[index].readonly) return;
      this.portfolio.projects[index].name = name;
      this.savePortfolio();
    },
    toggleProjectHide(index: number) {
      if (!this.portfolio) return;
      if (this.portfolio.projects[index].readonly) return;
      this.portfolio.projects[index].hidden = !this.portfolio.projects[index].hidden;
      this.savePortfolio();
    },
    moveProject({ from, to }: { from: number, to: number }) {
      if (!this.portfolio) return;
      const projects: statusType.Project[] = this.portfolio.projects;
      if (projects[from].readonly || projects[to].readonly) return;
      const coverIdx = projects.findIndex(p => p.readonly && p.order === 0);
      const endIdx = projects.findIndex(p => p.readonly && p.order === 100);
      // 只允许内容页项目在内容页项目之间移动
      if (from <= coverIdx || from >= endIdx || to <= coverIdx || to >= endIdx) return;
      const moved = projects.splice(from, 1)[0];
      projects.splice(to, 0, moved);
      this.currentProjectIndex = to;
      this.savePortfolio();
    },
    selectProject(index: number) {
      this.currentProjectIndex = index;
      this.currentPageNum = 0;
      this.savePortfolio();
    },
    // 页面相关
    selectPage(index: number) {
      this.currentPageNum = index;
    },
    addPage() {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      if (!project || project.readonly) return;

      let newPageNum = 1;
      if (project.pages && project.pages.length > 0) {
        const existingPageNums = project.pages.map(p => p.pageNum).filter(num => typeof num === 'number' && !isNaN(num));
        if (existingPageNums.length > 0) {
          newPageNum = Math.max(0, ...existingPageNums) + 1;
        } else {
          // If no valid numeric pageNums exist, or array was empty of numbers,
          // default to current length + 1 (which will be 1 if pages was empty).
          newPageNum = project.pages.length + 1;
        }
      }
      // Ensure newPageNum is at least 1, especially if pages array was empty.
      if (newPageNum <= 0) newPageNum = 1;

      const bkgUrl = this.portfolio.template?.contentPage?.url || '';

      project.pages.push({
        pageNum: newPageNum,
        order: newPageNum,
        type: 'content',
        projectId: project.uid,
        bkgUrl: bkgUrl,
      });
      this.currentPageNum = project.pages.length - 1; // Select the newly added page
      this.savePortfolio();
    },
    removePage(index: number) {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      if (!project || project.readonly) return;
      if (project.pages.length <= 1) {
        uni.showToast({ title: '至少保留一页', icon: 'none' });
        return;
      }
      project.pages.splice(index, 1);
      if (this.currentPageNum >= project.pages.length) {
        this.currentPageNum = project.pages.length - 1;
      }
      this.savePortfolio();
    },
    movePage({ from, to }: { from: number, to: number }) {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      if (!project || project.readonly) return;
      // 只允许内容页页面移动
      if (project.pages[from]?.type !== 'content' || project.pages[to]?.type !== 'content') return;
      const moved = project.pages.splice(from, 1)[0];
      project.pages.splice(to, 0, moved);
      this.currentPageNum = to;
      this.savePortfolio();
    },
    addText() {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      const page = project.pages[this.currentPageNum];
      if (!project || !page) return;
      const newText = {
        uid: `text_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        project_uid: project.uid,
        page_num: page.pageNum,
        content: '输入文字',
        margin_top: "40",
        margin_left: "40",
        font_size: "24",
        font_color: "000000",
        size: "24",
      };
      if (!project.texts) project.texts = [];
      project.texts.push(newText);
      this.savePortfolio();
    },
    async addImage() {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      const page = project.pages[this.currentPageNum];
      if (!project || !page) return;
      // 选择图片
      const chooseRes = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          success: resolve,
          fail: reject
        });
      });
      const filePath = chooseRes.tempFilePaths[0];
      const fileSuffix = getFileSuffix(filePath);
      const workUid = `work_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      // 上传图片
      const { ossKey, width, height } = await uploadWorkFile(
        filePath,
        this.portfolio.uid,
        project.uid,
        workUid,
        fileSuffix
      );
      // 新建 work
      const newWork: statusType.Work = {
        uid: `work_${(new Date()).toISOString()}_${Math.random().toString(36).slice(2,8)}`,
        project_uid: project.uid,
        page_num: page.pageNum,
        url: '',
        oss_key: ossKey,
        width: String(width),
        height: String(height),
        margin_top: "40",
        margin_left: "40",
        size: `${width}x${height}`,
        scale: 1,
        expireTime: (Date.now() + 30 * 60 * 1000).toString(), // 30分钟后过期
        // refresher: async (oss_key: string) => getSignedPreviewUrl(oss_key),
      };
      if (!project.works) project.works = [];
      project.works.push(newWork);
      this.savePortfolio();
    },
    deleteElement(id: string) {
      if (!this.portfolio) return;
      const project = this.portfolio.projects[this.currentProjectIndex];
      if (!project) return;
      // 删除 work
      if (project.works) {
        const idx = project.works.findIndex((w: any) => w.id === id);
        if (idx !== -1) {
          project.works.splice(idx, 1);
          this.savePortfolio();
          return;
        }
      }
      // 删除 text
      if (project.texts) {
        const idx = project.texts.findIndex((t: any) => t.id === id);
        if (idx !== -1) {
          project.texts.splice(idx, 1);
          this.savePortfolio();
        }
      }
    },
    // 可继续补充页面、分组、work等操作
  },
});