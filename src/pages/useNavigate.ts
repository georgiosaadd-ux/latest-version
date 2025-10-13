export const useNavigate = () => {
  return (path: string) => {
    window.location.href = path;
  };
};
