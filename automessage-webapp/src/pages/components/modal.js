function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-4 rounded-lg max-w-md w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">&times;</button>
          </div>
          <div className="mt-2">{children}</div>
          <div className="mt-4 text-right">
            <button
              onClick={onClose}
              className="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default Modal;
  