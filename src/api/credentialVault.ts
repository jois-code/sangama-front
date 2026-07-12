export const setPesuPassword = (password: string) => {
  localStorage.setItem('pesu_pwd', password);
};

export const getPesuPassword = () => {
  return localStorage.getItem('pesu_pwd');
};

export const clearPesuPassword = () => {
  localStorage.removeItem('pesu_pwd');
};
