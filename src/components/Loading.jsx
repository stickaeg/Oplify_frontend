const Spinner = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div
        className={
          "h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
        }
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export default Spinner;
