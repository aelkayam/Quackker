import { useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileImage } from "./ProfileImage";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import type { FormEvent } from "react";

export function NewQuackForm() {
  const session = useSession();

  if (session.status !== "authenticated") return null;

  return <Form />;
}

function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
  if (textArea == null) return;
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

function Form() {
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>();
  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaSize(textArea);
    textAreaRef.current = textArea;
  }, []);
  const trpcUtill = api.useUtils();

  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef.current);
  }, [inputValue]);

  const createQuack = api.quack.create.useMutation({
    onSuccess: (newQuack) => {
      setInputValue("");

      if (session.status !== "authenticated") return;

      trpcUtill.quack.infiniteFeed.setInfiniteData({}, (oldData) => {
        if (oldData?.pages[0] == null) return;

        const newCacheQuack = {
          ...newQuack,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data?.user.id,
            name: session.data?.user.name ?? null,
            image: session.data?.user.image ?? null,
          },
        };

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              quacks: [newCacheQuack, ...oldData.pages[0]?.quacks],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });
    },
  });

  // do not render the following code if not authenticated
  if (session.status !== "authenticated") return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createQuack.mutate({ content: inputValue });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-b px-4 py-2"
    >
      <div className="flex gap-4">
        <ProfileImage src={session.data.user.image} />
        <textarea
          ref={inputRef}
          style={{ height: 0 }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
          placeholder="What's on your mind?"
        />
      </div>
      <Button className="self-end">Quack</Button>
    </form>
  );
}
