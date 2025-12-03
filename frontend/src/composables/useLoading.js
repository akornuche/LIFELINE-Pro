import { ref } from 'vue';

export function useLoading(initialState = false) {
  const isLoading = ref(initialState);
  const error = ref(null);

  const startLoading = () => {
    isLoading.value = true;
    error.value = null;
  };

  const stopLoading = () => {
    isLoading.value = false;
  };

  const setError = (err) => {
    error.value = err;
    isLoading.value = false;
  };

  const withLoading = async (fn) => {
    startLoading();
    try {
      const result = await fn();
      stopLoading();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    withLoading
  };
}
