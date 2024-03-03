import { addFriendValidator } from "@/lib/validations/addFriend";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../../auth/authOptions";
import { fetchRedis } from "@/components/helpers/redis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = addFriendValidator.safeParse(body.email);
    if (!validation.success) return new NextResponse("Invalid Email. ", { status: 400 });

    const validatedEmail = validation.data.email;

    const idToAdd = (await fetchRedis(
      'get',
      `user:email:${validatedEmail}`
    )) as string

    if (!idToAdd) return new NextResponse("This person does not exist. ", { status: 400 });

    const session = await getServerSession(authOptions);
    
    if (!session) return new NextResponse("Unauthorised. ", { status: 401 });

    if (idToAdd === session.user.id) return new NextResponse("You cannot add yourself as a friend. ", { status: 400 });

    

  } catch (error) {
    
  }
}