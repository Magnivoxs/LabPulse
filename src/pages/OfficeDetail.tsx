import { useParams } from 'react-router-dom';

export default function OfficeDetail() {
  const { officeId } = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Office Detail - {officeId}</h1>
      <p className="text-gray-600">Will show tabs: Overview, Trends, Staff Roster, Notes, Financial Detail</p>
    </div>
  );
}

