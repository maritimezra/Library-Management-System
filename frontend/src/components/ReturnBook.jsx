import { gql, useQuery, useMutation } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

const ISSUED_BOOKS = gql`
  query GetIssuedBooks($memberId: Int!) {
    issuedBooks(memberId: $memberId) {
      issueDate
      id
      member {
        firstName
        lastName
      }
      book {
        title
        author
        publicationYear
      }
      fee
    }
  }
`;

const GET_MEMBER_DETAILS = gql`
  query GetMember($memberId: Int!) {
    getMember(memberId: $memberId) {
      id
      firstName
      lastName
      email
      phoneNumber
      balance
    }
  }
`;

const RETURN_BOOK_MUTATION = gql`
  mutation ReturnBook($transactionId: Int!) {
    returnBook(transactionId: $transactionId) {
      fee
      id
      issueDate
      returnDate
      book {
        id
        title
        publicationYear
        isbn
      }
      member {
        balance
        lastName
        firstName
      }
    }
  }
`;

const ReturnBook = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { loading: loadingBooks, error: errorBooks, data: dataBooks, refetch: refetchBooks } = useQuery(ISSUED_BOOKS, {
    variables: { memberId: parseInt(memberId) },
  });

  const { loading: loadingMember, error: errorMember, refetch: refetchMember } = useQuery(GET_MEMBER_DETAILS, {
    variables: { memberId: parseInt(memberId) },
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [returnSuccess, setReturnSuccess] = useState(null); 

  const [returnBook] = useMutation(RETURN_BOOK_MUTATION, {
    onCompleted: () => {
      setShowConfirmModal(false);
      setReturnSuccess(true)
      refetchBooks();
      refetchMember();
    },
    onError: (error) => {
      console.error("Error returning book:", error);
    }
  });

  useEffect(() => {
    refetchBooks();
    refetchMember();
  }, [memberId, refetchBooks, refetchMember]);

  const handleReturnClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowConfirmModal(true);
  };

  const handleReturnBook = () => {
    if (selectedTransaction) {
      returnBook({ variables: { transactionId: parseInt(selectedTransaction.id, 10) } });
    }
  };

  if (loadingBooks || loadingMember) return <p>Loading...</p>;
  if (errorBooks || errorMember) return <p>Error: {errorBooks?.message || errorMember?.message}</p>;

  return (
    <div className="transaction-page">
      <h2>Books Issued to Member</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Issue Date</th>
            <th>Return</th>
          </tr>
        </thead>
        <tbody>
          {dataBooks.issuedBooks.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.book.title}</td>
              <td>{new Date(transaction.issueDate).toLocaleDateString()}</td>
              <td>
                <FontAwesomeIcon 
                  icon={faExchangeAlt} 
                  onClick={() => handleReturnClick(transaction)}
                  style={{ cursor: 'pointer' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Return Book</h3>
            <p>Are you sure you want to return the book: <strong>{selectedTransaction?.book.title}</strong>?</p>
            <p>{selectedTransaction?.member.firstName} {selectedTransaction?.member.lastName} will be charged KES {selectedTransaction?.fee.toFixed(2)}</p>
            <button onClick={handleReturnBook}>Confirm Return</button>
            <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {returnSuccess !== null && (
        <div className="modal">
          <div className="modal-content">
            <h3>{returnSuccess ? 'Book Return Successfully' : 'Book return Failed'}</h3>
            <p>{returnSuccess ? 'The book has been successfully returned.' : 'Book return failed.'}</p>
            <button onClick={() => {
              setReturnSuccess(null);
              navigate('/'); 
            }} className="confirm-btn">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnBook;
