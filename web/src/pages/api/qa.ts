import type { NextApiRequest, NextApiResponse } from "next";

export type QAResponse = {
    answer: string;
    followupQuestions: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Array<QAResponse> | undefined>
) {
  const API_URL = "http://localhost:8080/qa";
  const data = await fetch(API_URL, {
    method: "POST",
    body: req.body,
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => {
    if (res.ok) {
      return res.json();
    }
    return null;
  });
  if (data) {
    return res.status(200).json(data);
  } 
    return res.status(400);
}