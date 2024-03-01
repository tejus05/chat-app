import db from '@/db'

export default async function Home() {

  const data = await db.set("foo", "bar");
  console.log("data: ", data)
  return (
    <div>
      hello
    </div>
  );
}
