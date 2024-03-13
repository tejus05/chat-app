# Real-Time Chat App

This is a real-time chat application built using Next.js 14 with the App Router, Upstash Redis for data storage, and Pusher for real-time communication. The app features various functionalities including adding, removing, denying or accepting users in real-time, real-time chatting, editing and deleting messages, and adding logged-in users from the dashboard on mobile and sidebar on laptops. It is also optimized for mobile devices and is fully responsive.

## Features

- **Real-Time Chatting**: Users can engage in real-time conversations with each other.
- **User Management**: Admins can add, remove, deny or accept users in real-time.
- **Message Editing**: Users can edit their messages in real-time.
- **Message Deletion**: Users can delete messages in real-time.
- **Responsive Design**: The app is optimized for mobile devices and is fully responsive.
- **User Addition**: Logged-in users can be added from the dashboard on mobile and from the sidebar on laptops.

## Technologies Used

- **Next.js 14**: A React framework for building server-side rendered and static web applications.
- **NextAuth**: An authentication library for Next.js applications.
- **Upstash Redis**: A managed Redis service for caching, real-time analytics, and session storage.
- **Pusher**: A hosted service that simplifies real-time messaging between servers, clients, and mobile devices.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/tejus05/chat-app.git
    ```

2. Install dependencies:

    ```bash
    cd chat-app
    npm install
    ```

3. Set up environment variables. You'll need to obtain API keys from Upstash Redis and Pusher.

    ```bash
    cp .env.example .env.local
    ```

    Edit the `.env.local` file and add your API keys:

    ```plaintext
    UPSTASH_REDIS_REST_URL=your-upstash-redis-url
    UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
    NEXTAUTH_SECRET=your-nextauth-secret
    NEXTAUTH_URL=http://localhost:3000
    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    PUSHER_APP_ID=your-pusher-app-id
    NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-key
    PUSHER_APP_SECRET=your-pusher-secret
    ```

4. Run the development server:

    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Demo



https://github.com/tejus05/chat-app/assets/118271901/e709deb1-c758-49b3-b9ad-de9fa981ddbd



## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/git/git-scm.com/blob/main/MIT-LICENSE.txt) file for details.
