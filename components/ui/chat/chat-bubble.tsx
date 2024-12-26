import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageLoading from "./message-loading";
import { Button, ButtonProps } from "../button";

// ChatBubble
const chatBubbleVariant = cva(
  "flex gap-2 max-w-[60%] items-end relative group",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-center",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  },
);

// Message bubble variants
const chatBubbleMessageVariants = cva(
  "rounded-2xl px-4 py-2.5 min-w-[60px] text-sm relative flex flex-col gap-1",
  {
    variants: {
      variant: {
        received: "bg-muted text-muted-foreground",
        sent: "bg-primary text-primary-foreground",
      },
      layout: {
        default: "",
        ai: "rounded-t-2xl rounded-br-2xl rounded-bl-lg shadow-sm",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  }
);

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout, className }),
        "relative group",
      )}
      ref={ref}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child,
      )}
    </div>
  )
);
ChatBubble.displayName = "ChatBubble";

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
  src,
  fallback,
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {src && !imageError ? (
        <AvatarImage 
          src={src} 
          onError={() => setImageError(true)}
          alt={fallback || "Avatar"}
        />
      ) : (
        <AvatarFallback delayMs={0}>
          {fallback}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ className, variant, layout, isLoading, children, ...props }, ref) => (
    <div
      className={cn(chatBubbleMessageVariants({ variant, layout, className }))}
      ref={ref}
      {...props}
    >
      <div className="flex-1 break-words">
        {isLoading ? <MessageLoading /> : children}
      </div>
    </div>
  )
);
ChatBubbleMessage.displayName = "ChatBubbleMessage";

interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
  variant?: "sent" | "received";
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
  timestamp,
  variant = "received",
  className,
  ...props
}) => (
  <div
    className={cn(
      "text-[10px] select-none",
      variant === "sent" 
        ? "text-primary-foreground/80" 
        : "text-muted-foreground/80",
      className
    )}
    {...props}
  >
    {timestamp}
  </div>
);

type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode;
};

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
  icon,
  onClick,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    className={cn(
      "opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {icon}
  </Button>
);

interface ChatBubbleActionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
  className?: string;
}

const ChatBubbleActionWrapper: React.FC<ChatBubbleActionWrapperProps> = ({
  variant = "received",
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "absolute bottom-0 flex gap-0.5",
      variant === "sent" ? "left-0 -translate-x-full pl-2" : "right-0 translate-x-full pr-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
};
