/**
 * Submits test results to the backend API.
 * @param {string} assignmentId - The unique ID of the test assignment.
 * @param {object} testData - The JSON object containing the results data for the specific test.
 * @returns {Promise<{success: boolean, message: string, data?: any}>} - Promise resolving to success status and message.
 */
export async function submitResults(assignmentId, testData) {
    if (!assignmentId || !testData) {
      console.error("submitResults: Missing assignmentId or testData");
      return { success: false, message: "Missing required data for submission." };
    }
  
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId, testData }),
      });
  
      const responseData = await response.json();
  
      if (!response.ok) {
        // Use message from backend if available, otherwise provide generic error
        throw new Error(responseData.message || `Server responded with status ${response.status}`);
      }
  
      console.log('Results submitted successfully:', responseData);
      return { success: true, message: responseData.message || 'Results submitted successfully.', data: responseData };
  
    } catch (error) {
      console.error('Error submitting results:', error);
      return { success: false, message: error.message || 'An unexpected error occurred while submitting results.' };
    }
  }