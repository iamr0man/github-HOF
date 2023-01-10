import * as dotenv from 'dotenv';
import * as https from 'https';
import { logError, logSuccess } from './logger';

dotenv.config();

const GITHUB_API_URL = 'https://api.github.com';
const MAX_REPO_PER_PAGE = 100;

enum SORT {
  stars = 'stars',
}

export async function getRepositories(
  language: string | undefined,
): Promise<[] | Error> {
  const searchRepoUrl = `${GITHUB_API_URL}/search/repositories`;
  // const urlWithQuery = `${searchRepoUrl}?l${language}&sort=${SORT.stars}&per_page=${MAX_REPO_PER_PAGE}`;
  const options = {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    hostname: 'api.github.com',
    path: `/search/repositories?l${language}&sort=${SORT.stars}&per_page=${MAX_REPO_PER_PAGE}`,
    method: 'GET',
  };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  options.agent = new https.Agent(options);

  const req = https
    .request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logSuccess(data);
        return JSON.parse(data);
      });
    })
    .on('error', (err) => {
      logError(err);
    })
    .end();
  // eslint-disable-next-line no-console
  console.log(req);

  return Promise.resolve([]);
}

getRepositories('javascript')
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
