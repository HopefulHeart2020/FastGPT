const tokenKey = 'fast-gpt-token';
export const PRICE_SCALE = 100000;

export const setToken = (val: string) => {
  localStorage.setItem(tokenKey, val);
};
export const getToken = () => {
  return localStorage.getItem(tokenKey);
};
export const clearToken = () => {
  localStorage.removeItem(tokenKey);
};

/**
 * 把数据库读取到的price，转化成元
 */
export const formatPrice = (val: number) => {
  return val / PRICE_SCALE;
};
