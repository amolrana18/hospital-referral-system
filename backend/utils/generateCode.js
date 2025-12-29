const generateReferralCode = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `REF-${year}${month}${day}-${random}`;
};

const generateHospitalCode = (districtCode, sequence) => {
  return `HOSP-${districtCode}-${String(sequence).padStart(3, '0')}`;
};

const generateEmployeeCode = (hospitalCode, designation, sequence) => {
  const prefix = designation === 'Doctor' ? 'DOC' : 
                designation === 'Nurse' ? 'NUR' : 
                designation === 'Hospital Admin' ? 'ADM' : 'EMP';
  
  return `${hospitalCode}-${prefix}-${String(sequence).padStart(3, '0')}`;
};

module.exports = {
  generateReferralCode,
  generateHospitalCode,
  generateEmployeeCode
};