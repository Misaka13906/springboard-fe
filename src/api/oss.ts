import OSS from 'ali-oss';
import { request } from './request';
// import { base } from '../types';
// import { isAppPlatform } from '../utils/platform';

// Read OSS config from environment variables
const OSS_REGION = import.meta.env.VITE_OSS_REGION;
const OSS_BUCKET = import.meta.env.VITE_OSS_BUCKET;

if (!OSS_REGION || !OSS_BUCKET) {
  console.error("Error: VITE_OSS_REGION or VITE_OSS_BUCKET is not defined in your environment variables.");
  // Optionally throw an error
  // throw new Error("OSS Region or Bucket is not configured.");
}


// --- Helper to get file suffix ---
export const getFileSuffix = (filePathOrName: string): string => {
    const match = filePathOrName.match(/\.([^.]+)$/);
    return match ? match[0] : '';
}

/**
 * 获取 OSS 上传用的 signedUrl 和预览用的 ossKey
 * @param filename 文件名（带后缀）
 * @param contentType 文件的 Content-Type
 * @returns { uploadUrl: string, ossKey: string }
 */
export const getSignedUploadUrl = async (filename: string, contentType: string): Promise<{ uploadUrl: string, ossKey: string }> => {
  // 后端接口: /oss/sts/upload?filename=xxx&contentType=xxx
  const res = await request<{ uploadUrl: string, ossKey: string }>({
    url: `/oss/sts/upload?filename=${filename}&contentType=${encodeURIComponent(contentType)}`,
    method: 'GET',
  });
  return res;
};

/**
 * 获取 OSS 预览用的 signedUrl
 * @param ossKey OSS 对象 key
 * @returns 预览 url
 */
export const getSignedPreviewUrl = async (ossKey: string): Promise<string> => {
  // 后端接口: /oss/sts/preview?ossKey=xxx
  console.log("[getSignedPreviewUrl] oss key: ", ossKey)
  const res = await request<{ previewUrl: string }>({
    url: `/oss/sts/preview?ossKey=${ossKey}`,
    method: 'GET',
  });
  return res.previewUrl;
};

/**
 * 上传作品文件到 OSS，并返回图片的宽高信息
 * @param filePath 本地文件路径
 * @param portfolioId 作品集ID（可用于生成唯一文件名）
 * @param projectUid 分组ID
 * @param workUid 作品ID
 * @param fileSuffix 文件后缀（如 .jpg）
 * @returns 上传后 OSS 的 key 及图片宽高 { ossKey, width, height }
 */
export const uploadWorkFile = async (
  filePath: string,
  portfolioId: string,
  projectUid: string,
  workUid: string,
  fileSuffix: string
): Promise<{ ossKey: string, width: number, height: number }> => {
  // 生成唯一文件名
  const filename = `${portfolioId}_${projectUid}_${workUid}${fileSuffix}`;
  // 根据文件后缀判断 contentType
  let contentType = 'application/octet-stream';
  if (fileSuffix === '.png') contentType = 'image/png';
  else if (fileSuffix === '.jpg' || fileSuffix === '.jpeg') contentType = 'image/jpeg';
  else if (fileSuffix === '.webp') contentType = 'image/webp';
  else if (fileSuffix === ".svg") contentType = "image/svg+xml";
  // 获取上传用的 signedUrl 和 ossKey
  const { uploadUrl, ossKey } = await getSignedUploadUrl(filename, contentType);

  let fileData: ArrayBuffer;
  const sys = uni.getSystemInfoSync();
  console.log('[uploadWorkFile] platform:', sys.platform, 'filePath:', filePath);
  if (
    sys.platform === 'devtools' ||
    sys.platform === 'mp-weixin' ||
    sys.platform === 'Android' ||
    sys.platform === 'mp-alipay' ||
    sys.platform === 'mp-baidu' ||
    sys.platform === 'mp-qq' ||
    sys.platform === 'mp-jd'
  ) {
    // 小程序端
    console.log('[uploadWorkFile] using uni.getFileSystemManager');
    fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
      uni.getFileSystemManager().readFile({
        filePath,
        success: (res) => {
          console.log('[uploadWorkFile] getFileSystemManager readFile success');
          resolve(res.data as ArrayBuffer);
        },
        fail: (err) => {
          console.error('[uploadWorkFile] getFileSystemManager readFile fail', err);
          reject(err);
        }
      });
    });
  } else if (typeof plus !== 'undefined' && plus.io) {
    // App端
    console.log('[uploadWorkFile] using plus.io');
    fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
      let finished = false;
      const timeout = setTimeout(() => {
        if (!finished) {
          console.error('[uploadWorkFile] plus.io 超时，未回调任何结果');
          reject(new Error('plus.io 读取文件超时'));
        }
      }, 8000);

      plus.io.resolveLocalFileSystemURL(filePath, function(entry: any) {
        console.log('[uploadWorkFile] resolveLocalFileSystemURL success', entry);
        if (entry.isFile) {
          entry.file(function(file: any) {
            console.log('[uploadWorkFile] entry.file success', file);
            // @ts-ignore
            var reader = new plus.io.FileReader();
            reader.onload = function() {
              if (!finished) {
                finished = true;
                clearTimeout(timeout);
                // @ts-ignore
                console.log('[uploadWorkFile] plus.io FileReader onload');
                resolve(reader.result as unknown as ArrayBuffer);
              }
            };
            reader.onerror = function(e: any) {
              if (!finished) {
                finished = true;
                clearTimeout(timeout);
                console.error('[uploadWorkFile] plus.io FileReader error', e);
                reject(e);
              }
            };
            // @ts-ignore
            reader.readAsArrayBuffer(file);
          }, function(e: any) {
            if (!finished) {
              finished = true;
              clearTimeout(timeout);
              console.error('[uploadWorkFile] entry.file error', e);
              reject(e);
            }
          });
        } else {
          if (!finished) {
            finished = true;
            clearTimeout(timeout);
            console.error('[uploadWorkFile] Not a file:', entry);
            reject(new Error('Not a file'));
          }
        }
      }, function(e: any) {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          console.error('[uploadWorkFile] resolveLocalFileSystemURL error', e);
          reject(e);
        }
      });
    });
  } else {
    console.error('[uploadWorkFile] 当前平台不支持文件读取');
    throw new Error('当前平台不支持文件读取');
  }
  
  // if (typeof plus !== 'undefined' && plus.android) {
  //   const main = plus.android.runtimeMainActivity();
  //   const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
  //   const Context = plus.android.importClass('android.content.Context');
  //   const permission = 'android.permission.READ_EXTERNAL_STORAGE';
  //   if (plus.android.invoke(main, 'checkSelfPermission', permission) !== PackageManager.PERMISSION_GRANTED) {
  //     plus.android.requestPermissions([permission], function(resultObj) {
  //       console.log('Android permissions result:', JSON.stringify(resultObj));
  //     }, function(error) {
  //       console.error('Android permissions error:', error);
  //     });
  //   }
  // }

  console.log('[uploadWorkFile] fileData length:', fileData ? fileData.byteLength : 'null');

  await new Promise<void>((resolve, reject) => {
    uni.request({
      url: uploadUrl,
      method: 'PUT',
      data: fileData,
      header: {
        'Content-Type': contentType
      },
      responseType: 'text',
      success: (res) => {
        console.log('[uploadWorkFile] uni.request PUT success', res);
        if (res.statusCode === 200) {
          resolve();
        } else {
          uni.showToast({
            title: '上传失败，请稍后重试',
            icon: 'none'
          });
          reject(new Error('上传失败，状态码：' + res.statusCode));
        }
      },
      fail: (err) => {
        console.error('[uploadWorkFile] uni.request PUT fail', err);
        uni.showToast({
          title: '上传失败，请检查网络连接',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
  // 获取图片宽高信息
  const { width, height } = await new Promise<{ width: number, height: number }>((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (info) => {
        resolve({ width: info.width, height: info.height });
      },
      fail: (err) => {
        // 获取失败时返回0
        resolve({ width: 0, height: 0 });
      }
    });
  });
  return { ossKey, width, height };
};
