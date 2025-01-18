import { useEffect } from "react";
import useStore from "../store/store";

interface VueUpdateEvent extends CustomEvent {
  detail: {
    type: string;
    data: any;
  };
}

export const useVueUpdates = () => {
  const setProjects = useStore((state) => state.setProjects);
  const setTasks = useStore((state) => state.setTasks);

  useEffect(() => {
    const handleVueUpdate = (event: VueUpdateEvent) => {
      const { type, data } = event.detail;
      console.log("Received update from Vue:", { type, data });

      switch (type) {
        case "projects":
          setProjects(data);
          break;
        case "tasks":
          setTasks(data);
          break;
        default:
          console.warn("Unknown update type from Vue:", type);
      }
    };

    window.addEventListener("vueUpdate", handleVueUpdate as EventListener);
    return () => {
      window.removeEventListener("vueUpdate", handleVueUpdate as EventListener);
    };
  }, [setProjects, setTasks]);
};
