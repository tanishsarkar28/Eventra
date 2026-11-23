function Error({ statusCode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>{statusCode ? `${statusCode}` : 'Error'}</h1>
      <p>{statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
