"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { EmptyPlaceHolder } from "../../lib/types/placeholders.types";

const EmptyTemplate = (props: EmptyPlaceHolder) => {
  const { icon, title, description } = props;
  const ICON = icon;
  return (
    <Empty className={`w-full`}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ICON />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};

export default EmptyTemplate;
