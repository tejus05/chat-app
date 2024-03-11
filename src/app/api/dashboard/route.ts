import { fetchRedis } from "@/components/helpers/redis";
import { NextRequest, NextResponse } from "next/server";
import db from '@/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const userExists = await fetchRedis("get", `user:${userId}`) as string;
    if (!userExists) return new NextResponse("Unauthorised. ", { status: 401 }); 

    const user = JSON.parse(userExists);

    const data = await db.sadd(`users`, user);

    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal Server Error. ", { status: 500 });
  }
}