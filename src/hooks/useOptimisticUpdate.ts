import { useState } from "react";

/**
 * Hook for optimistic UI updates
 * Updates UI immediately while async operation completes in background
 */
export const useOptimisticUpdate = <T>() => {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const update = async (
    newData: T,
    asyncOperation: () => Promise<void>
  ) => {
    // Store current optimistic state
    setOptimisticData(newData);
    setIsOptimistic(true);

    try {
      // Perform async operation
      await asyncOperation();
    } catch (error) {
      // Revert on error
      setOptimisticData(null);
      throw error;
    } finally {
      setIsOptimistic(false);
    }
  };

  const reset = () => {
    setOptimisticData(null);
    setIsOptimistic(false);
  };

  return {
    optimisticData,
    isOptimistic,
    update,
    reset,
  };
};
