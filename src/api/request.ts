import axios, { Method, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, clearToken } from '@/utils/user';
import { TOKEN_ERROR_CODE } from '@/service/errorCode';

interface ConfigType {
  headers?: { [key: string]: string };
  hold?: boolean;
}
interface ResponseDataType {
  code: number;
  message: string;
  data: any;
}

/**
 * 请求开始
 */
function requestStart(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (config.headers) {
    config.headers.Authorization = getToken();
  }

  return config;
}

/**
 * 请求成功,检查请求头
 */
function responseSuccess(response: AxiosResponse<ResponseDataType>) {
  return response;
}
/**
 * 响应数据检查
 */
function checkRes(data: ResponseDataType) {
  if (data === undefined) {
    console.log('error->', data, 'data is empty');
    return Promise.reject('服务器异常');
  } else if (data.code < 200 || data.code >= 400) {
    return Promise.reject(data);
  }
  return data.data;
}

/**
 * 响应错误
 */
function responseError(err: any) {
  console.log('error->', '请求错误', err);

  if (!err) {
    return Promise.reject({ message: '未知错误' });
  }
  if (typeof err === 'string') {
    return Promise.reject({ message: err });
  }
  if (err.response) {
    // 有报错响应
    const res = err.response;
    if (res.data.code in TOKEN_ERROR_CODE) {
      clearToken();
      return Promise.reject({ message: 'token过期，重新登录' });
    }
  }
  return Promise.reject(err);
}

/* 创建请求实例 */
const instance = axios.create({
  timeout: 60000, // 超时时间
  headers: {
    'content-type': 'application/json'
  }
});

/* 请求拦截 */
instance.interceptors.request.use(requestStart, (err) => Promise.reject(err));
/* 响应拦截 */
instance.interceptors.response.use(responseSuccess, (err) => Promise.reject(err));

function request(url: string, data: any, config: ConfigType, method: Method): any {
  /* 去空 */
  for (const key in data) {
    if (data[key] === null || data[key] === undefined) {
      delete data[key];
    }
  }

  return instance
    .request({
      baseURL: '/api',
      url,
      method,
      data: method === 'GET' ? null : data,
      params: method === 'GET' ? data : null, // get请求不携带data，params放在url上
      ...config // 用户自定义配置，可以覆盖前面的配置
    })
    .then((res) => checkRes(res.data))
    .catch((err) => responseError(err));
}

/**
 * api请求方式
 * @param {String} url
 * @param {Any} params
 * @param {Object} config
 * @returns
 */
export function GET<T>(url: string, params = {}, config: ConfigType = {}): Promise<T> {
  return request(url, params, config, 'GET');
}

export function POST<T>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'POST');
}

export function PUT<T>(url: string, data = {}, config: ConfigType = {}): Promise<T> {
  return request(url, data, config, 'PUT');
}

export function DELETE<T>(url: string, config: ConfigType = {}): Promise<T> {
  return request(url, {}, config, 'DELETE');
}
