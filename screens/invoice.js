import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';

export default function InvoiceScreen({ route }) {
  const { windows } = route.params;

  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfUri, setPdfUri] = useState(null);

  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [additionalCosts, setAdditionalCosts] = useState([]);

  const [discount, setDiscount] = useState('0');
  const [laborCharges, setLaborCharges] = useState('');

  const [bankingDetails] = useState({
    accountName: 'Glasnood Pty Ltd',
    accountNumber: '123456789',
    bankName: 'National Bank',
    branchCode: '123456',
  });

  const invoiceNumber = Math.floor(1000 + Math.random() * 9000);
  const date = new Date().toLocaleDateString();

  const validateFields = () => {
    if (!customerName.trim()) return 'Customer name is required.';
    if (!email.trim() || !email.includes('@')) return 'Valid email is required.';
    if (!phone.trim() || phone.length < 8) return 'Valid phone number is required.';
    if (!address.trim()) return 'Address is required.';
    if (!windows || windows.length === 0) return 'Window list is empty.';
    return null;
  };

  const addAdditionalCost = () => {
    if (!costDescription.trim() || !costAmount.trim()) {
      Alert.alert('Input Error', 'Please enter a valid description and amount.');
      return;
    }

    setAdditionalCosts(prev => [
      ...prev,
      { description: costDescription, amount: parseFloat(costAmount) },
    ]);
    setCostDescription('');
    setCostAmount('');
  };

  const removeAdditionalCost = (index) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    const error = validateFields();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }
  
    setLoading(true);
  
    const windowRows = windows
      .map((window, i) => {
        const area = (window.width / 1000) * (window.height / 1000);
        const glassCost = area * window.price * window.quantity;
        const frameCost = (window.framePrice || 0) * window.quantity;
        const totalCost = glassCost + frameCost;
  
        return `
          <tr>
            <td>${i + 1}</td>
            <td>${window.width} mm</td>
            <td>${window.height} mm</td>
            <td>${window.thickness} mm</td>
            <td>${window.glassType}</td>
            <td>${window.frameMaterial}</td>
            <td>${window.quantity}</td>
            <td>R ${totalCost.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');
  
    const subtotal = windows.reduce((sum, window) => {
      const area = (window.width / 1000) * (window.height / 1000);
      const glassCost = area * window.price * window.quantity;
      const frameCost = (window.framePrice || 0) * window.quantity;
      return sum + glassCost + frameCost;
    }, 0);
  
    const additionalCostTotal = additionalCosts.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = parseFloat(discount) || 0;
    const laborAmount = parseFloat(laborCharges) || 0;
    const total = subtotal + laborAmount + additionalCostTotal - discountAmount;
  
    const additionalCostsHTML = additionalCosts
      .map(item => `<li>${item.description}: R ${item.amount.toFixed(2)}</li>`)
      .join('');
  
    const html = `
      <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 30px;
      }

      .banner {
        background-color: #FFD700;
        color: #000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        font-size: 20px;
        font-weight: bold;
        border-radius: 5px;
        margin-bottom: 30px;
      }

      .banner .left {
        font-size: 24px;
      }

      .banner .right {
        text-align: right;
        font-weight: normal;
        font-size: 16px;
      }

      .header {
        text-align: center;
        margin-bottom: 40px;
      }

      .header h2 {
        font-size: 28px;
        color: #333;
        margin-bottom: 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      th, td {
        padding: 8px;
        text-align: left;
        border: 1px solid #ddd;
      }

      th {
        background-color: #f4f4f4;
      }

      .summary-table {
        width: 40%;
        float: right;
        border: 1px solid #ccc;
        margin-top: 20px;
      }

      .summary-table td {
        padding: 8px;
      }

      .summary-label {
        font-weight: bold;
      }

      ul {
        padding-left: 20px;
      }
    </style>
  </head>
  <body>
    <div class="banner">
      <div class="left">
        GLASNOOD
      </div>
      <div class="right">
        <p><strong>Invoice #: </strong>${invoiceNumber}</p>
        <p><strong>Date:</strong> ${date}</p>
      </div>
    </div>

    <div class="header">
      <h2>Invoice</h2>
    </div>

    <h2>Customer Information</h2>
    <p><strong>Name:</strong> ${customerName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Description:</strong> ${description}</p>

    <h2>Window Details</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Width</th>
          <th>Height</th>
          <th>Thickness</th>
          <th>Glass Type</th>
          <th>Frame Material</th>
          <th>Quantity</th>
          <th>Price (R)</th>
        </tr>
      </thead>
      <tbody>
        ${windowRows}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td class="summary-label">Subtotal:</td>
        <td>R ${subtotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="summary-label">Labor Charges:</td>
        <td>R ${laborAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="summary-label">Additional Costs:</td>
        <td>R ${additionalCostTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="summary-label">Discount:</td>
        <td>-R ${discountAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="summary-label"><strong>Total:</strong></td>
        <td><strong>R ${total.toFixed(2)}</strong></td>
      </tr>
    </table>

    <h3>Additional Cost Details</h3>
    <ul>${additionalCostsHTML}</ul>

    <h3>Banking Details</h3>
    <p><strong>Account Name:</strong> ${bankingDetails.accountName}</p>
    <p><strong>Account Number:</strong> ${bankingDetails.accountNumber}</p>
    <p><strong>Bank:</strong> ${bankingDetails.bankName}</p>
    <p><strong>Branch Code:</strong> ${bankingDetails.branchCode}</p>
  </body>
</html>

    `;
  
    try {
      const { uri } = await printToFileAsync({ html });
      setPdfUri(uri);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };
  

  const sharePDF = async () => {
    if (pdfUri) {
      try {
        await Sharing.shareAsync(pdfUri);
      } catch (error) {
        Alert.alert('Error', 'Failed to share PDF.');
      }
    } else {
      Alert.alert('Error', 'No PDF generated to share.');
    }
  };

  const sendEmail = async () => {
    if (pdfUri) {
      try {
        await MailComposer.composeAsync({
          recipients: [email],
          subject: `Invoice #${invoiceNumber}`,
          body: 'Please find the attached invoice.',
          attachments: [pdfUri],
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to send email.');
      }
    } else {
      Alert.alert('Error', 'No PDF generated to send.');
    }
  };

  const totalAmount = () => {
    const subtotal = windows.reduce((sum, window) => {
      const area = (window.width / 1000) * (window.height / 1000);
      const glassCost = area * window.price * window.quantity;
      const frameCost = (window.framePrice || 0) * window.quantity;
      return sum + glassCost + frameCost;
    }, 0);

    const additionalCostTotal = additionalCosts.reduce((sum, item) => sum + item.amount, 0);
    const laborAmount = parseFloat(laborCharges) || 0;
    const discountAmount = parseFloat(discount) || 0;
    return (subtotal + laborAmount + additionalCostTotal - discountAmount).toFixed(2);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Invoice Creation</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.sectionTitle}>Additional Costs</Text>
          <TextInput
            style={styles.input}
            placeholder="Cost Description"
            value={costDescription}
            onChangeText={setCostDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (R)"
            value={costAmount}
            onChangeText={setCostAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.button} onPress={addAdditionalCost}>
            <Text style={styles.buttonText}>Add Cost</Text>
          </TouchableOpacity>

          {additionalCosts.map((item, index) => (
            <View key={index} style={styles.costRow}>
              <Text>{item.description}: R {item.amount.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeAdditionalCost(index)}>
                <Text style={{ color: 'red' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Discount</Text>
          <TextInput
            style={styles.input}
            placeholder="Discount Amount (R)"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
          />

          <Text style={styles.sectionTitle}>Labor Charges</Text>
          <TextInput
            style={styles.input}
            placeholder="Labor Charges (R)"
            value={laborCharges}
            onChangeText={setLaborCharges}
            keyboardType="numeric"
          />
        </View>

        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
          Grand Total: R {totalAmount()}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={generatePDF}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Generate Invoice PDF</Text>
        </TouchableOpacity>

        {loading && <Text>Generating PDF...</Text>}

        {pdfUri && !loading && (
          <>
            <TouchableOpacity style={styles.button} onPress={sharePDF}>
              <Text style={styles.buttonText}>Share PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={sendEmail}>
              <Text style={styles.buttonText}>Email Invoice</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});
