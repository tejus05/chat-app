import { addFriendValidator } from "@/lib/validations/addFriend";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../../auth/authOptions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = addFriendValidator.safeParse(body.email);
    if (!validation.success) return new NextResponse("Invalid Email. ", { status: 400 });

    const validatedEmail = validation.data.email;

    const RESTResponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:email${validatedEmail}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      },
      cache: "no-store"
    });

    const data = await RESTResponse.json() as {result: string};

    const idToAdd = data.result;

    if (!idToAdd) return new NextResponse("This person does not exist. ", { status: 400 });

    const session = await getServerSession(authOptions);
    
    if (!session) return new NextResponse("Unauthorised. ", { status: 401 });

    if (idToAdd === session.user.id) return new NextResponse("You cannot add yourself as a friend. ", { status: 400 });

    return NextResponse.json(data)
  } catch (error) {
    
  }
}