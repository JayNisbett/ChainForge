import React from "react";
import { Button, Loader } from "@mantine/core";
import { IconFileSymlink } from "@tabler/icons-react";
import { useClipboard } from "@mantine/hooks";
import { IS_RUNNING_LOCALLY } from "../../utils/app";
import { useAppActions } from "../../hooks/useAppActions";

const ShareFlowButton: React.FC = () => {
  const clipboard = useClipboard();
  const { onClickShareFlow } = useAppActions();

  if (IS_RUNNING_LOCALLY) {
    return null;
  }

  return (
    <Button
      onClick={onClickShareFlow}
      size="sm"
      variant="outline"
      compact
      color={clipboard.copied ? "teal" : "blue"}
      mr="xs"
      style={{ float: "left" }}
    >
      {clipboard.copied ? (
        "Link copied!"
      ) : (
        <>
          <IconFileSymlink size="16px" />
          Share
        </>
      )}
    </Button>
  );
};

export default ShareFlowButton;
