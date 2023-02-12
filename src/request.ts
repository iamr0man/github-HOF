import * as https from 'https';
import { IncomingMessage } from 'http';
import { httpStatusCodes } from './httpStatusCodes';
import { logSuccess } from './logger';

export async function request<T>(url: string): Promise<T> {
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
  return new Promise((resolve) => {
    const callback = (res: IncomingMessage) => {
      if (res.statusCode === httpStatusCodes.VALIDATION_FAILED) {
        throw new Error('Validation failed, or the endpoint has been spammed.');
      }
      if (res.statusCode === httpStatusCodes.INTERNAL_SERVER) {
        throw new Error('Service unavailable');
      }

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        logSuccess(data);
        resolve(JSON.parse(data));
      });
    };

    https.request(url, options, callback).end();
  });
}
