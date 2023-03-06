import axios, { CreateAxiosDefaults } from 'axios';
import * as https from 'https';
import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { httpStatusCodes } from './httpStatusCodes';

export type RequestData<T> = {
  headers: IncomingHttpHeaders;
  data: T;
};

const createAxios = (config?: CreateAxiosDefaults) => axios.create(config);

export const axiosInstance = createAxios({
  adapter: function (config) {
    const axiosAdapter = createAxios();
    return axiosAdapter.get(config.url as string, { headers: config.headers });
  },
});

export async function request<T>(url: string) {
  const USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

  const options = {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      'user-agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  };
  const { data, headers } = await axiosInstance.get<T>(url, options);
  return Promise.resolve({ data, headers });

  // return new Promise((resolve) => {
  //   const callback = (res: IncomingMessage) => {
  //     if (res.statusCode === httpStatusCodes.VALIDATION_FAILED) {
  //       throw new Error('Validation failed, or the endpoint has been spammed.');
  //     }
  //     if (res.statusCode === httpStatusCodes.INTERNAL_SERVER) {
  //       throw new Error('Service unavailable');
  //     }
  //
  //     let data = '';
  //
  //     res.on('data', (chunk) => {
  //       data += chunk;
  //     });
  //
  //     res.on('end', () => {
  //       resolve({ headers: res.headers, data: JSON.parse(data) });
  //     });
  //   };
  //
  //   https.request(url, options, callback).end();
  // });
}
