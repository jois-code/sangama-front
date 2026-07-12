let pesuPassword: string | null = null;

export const setPesuPassword = (password: string) => {
  pesuPassword = password;
};

export const getPesuPassword = () => pesuPassword;

export const clearPesuPassword = () => {
  pesuPassword = null;
};
