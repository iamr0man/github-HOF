import { MAX_REPO_PER_PAGE } from '../constants';

export const usePagination = (currentPage: number, totalRepositories: number) => {
  const page = ++currentPage;

  let perPage = MAX_REPO_PER_PAGE;
  const isSinglePage = totalRepositories === 1;
  const isLastPage = page !== 1 && page === Math.round(totalRepositories / MAX_REPO_PER_PAGE);
  const isOddLength = totalRepositories % 2 > 0;

  if ((isSinglePage || isLastPage) && isOddLength) {
    perPage = totalRepositories % MAX_REPO_PER_PAGE;
  }
  return {
    currentPage: page,
    perPage,
  };
};
