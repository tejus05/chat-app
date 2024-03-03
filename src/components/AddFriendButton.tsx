"use client";

import { addFriendValidator } from "@/lib/validations/addFriend";
import axios, { AxiosError } from 'axios';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { z } from "zod";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const AddFriendButton = () => {
  const [showSuccessState, setShowSuccessState] = useState(false);

  type TAddFriendValidator = z.infer<typeof addFriendValidator>;

  const { register, handleSubmit, setError, formState:{errors} } = useForm<TAddFriendValidator>({
    resolver: zodResolver(addFriendValidator)
  });

  const addFriend = async (email: TAddFriendValidator) => {
    try {
      const validatedEmail = addFriendValidator.safeParse(email);

      console.log(validatedEmail)

      if (!validatedEmail.success) {
        return setError('email', { message: "Please enter a valid email. " });
      }

      await axios.post('/api/friends/add', {
        email: validatedEmail.data
      });

      setShowSuccessState(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError('email',{message: error.message})
      }
      if (error instanceof AxiosError) {
        setError("email", { message: error.response?.data });
      }
      setError('email',{message: "Something went wrong"})
      setShowSuccessState(false);
    }
  }

  const onSubmit = (data: TAddFriendValidator) => {
    addFriend({email: data.email});
  }

  return (
    <form className="max-w-sm" onSubmit={handleSubmit(onSubmit)}>
      <Label
        htmlFor="email"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Add a friend by E-Mail
      </Label>

      <div className="mt-2 flex gap-4">
        <Input
          {...register("email")}
          type="text"
          placeholder="you@example.com"
        />
        <Button type="submit">Add</Button>
      </div>
      <p className="mt-1 text-sm text-red-600">{errors.email?.message}</p>
      {showSuccessState ? (
        <p className="mt-1 text-sm text-green-600">Friend request sent!</p>
      ) : null}
    </form>
  );
}

export default AddFriendButton