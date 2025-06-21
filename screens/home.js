import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function Home({ navigation }) {
  const [windows, setWindows] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const addWindow = () => {
    setWindows([
      ...windows,
      {
        id: Date.now().toString(),
        width: '',
        height: '',
        thickness: '',
        price: '',
        quantity: '',
        glassType: 'Tempered',
        frameMaterial: 'Aluminum',
        framePrice: '',
      },
    ]);
  };

  const duplicateWindow = (id) => {
    const windowToDuplicate = windows.find((w) => w.id === id);
    if (windowToDuplicate) {
      setWindows([
        ...windows,
        {
          ...windowToDuplicate,
          id: Date.now().toString(),
        },
      ]);
    }
  };

  const clearAllWindows = () => {
    Alert.alert('Clear All', 'Are you sure you want to remove all windows?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => setWindows([]) },
    ]);
  };

  const updateWindow = (id, field, value) => {
    const updatedWindows = windows.map((w) =>
      w.id === id ? { ...w, [field]: value } : w
    );
    setWindows(updatedWindows);
  };

  const calculateWindowPrice = (window) => {
    const { width, height, price, quantity, framePrice } = window;
    if (!width || !height || !price || !quantity) return 0;

    const area = (parseFloat(width) / 1000) * (parseFloat(height) / 1000);
    let total = area * parseFloat(price) * parseInt(quantity);
    const frameCost = parseFloat(framePrice || 0) * parseInt(quantity);
    total += frameCost;

    return total.toFixed(2);
  };

  const calculateTotalPrice = () => {
    const total = windows.reduce((sum, win) => {
      const price = calculateWindowPrice(win);
      return sum + parseFloat(price || 0);
    }, 0);

    setTotalPrice(total.toFixed(2));
  };

  const removeWindow = (id) => {
    setWindows(windows.filter((win) => win.id !== id));
  };

  const isValid = (window) => {
    const required = ['width', 'height', 'price', 'quantity'];
    return required.every((field) => window[field] && !isNaN(window[field]));
  };

  const handleNext = () => {
    if (windows.length === 0) {
      Alert.alert('No Windows', 'Please add at least one window.');
      return;
    }

    const allValid = windows.every(isValid);
    if (!allValid) {
      Alert.alert('Missing Fields', 'Please fill in all required fields with valid numbers.');
      return;
    }

    calculateTotalPrice();

    navigation.navigate('Invoice', {
      windows,
      totalPrice,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={styles.title}>🧾 Create Invoice</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={addWindow}>
          <Text style={styles.addButtonText}>➕ Add Window</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllWindows}>
          <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
        </TouchableOpacity>
      </View>

      {windows.map((item, index) => (
        <View key={item.id} style={styles.windowContainer}>
          <Text style={styles.windowTitle}>Window {index + 1}</Text>

          {renderInput('Width (mm)', item.width, (val) => updateWindow(item.id, 'width', val), 'e.g. 1200')}
          {renderInput('Height (mm)', item.height, (val) => updateWindow(item.id, 'height', val), 'e.g. 1000')}
          {renderInput('Thickness (mm)', item.thickness, (val) => updateWindow(item.id, 'thickness', val), 'e.g. 6')}
          {renderInput('Price per m² (R)', item.price, (val) => updateWindow(item.id, 'price', val), 'e.g. 450')}
          {renderInput('Quantity', item.quantity, (val) => updateWindow(item.id, 'quantity', val), 'e.g. 3')}

          <Text style={styles.label}>Glass Type:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.glassType}
              onValueChange={(val) => updateWindow(item.id, 'glassType', val)}
              style={styles.picker}
            >
              <Picker.Item label="Tempered" value="Tempered" />
              <Picker.Item label="Laminated" value="Laminated" />
              <Picker.Item label="Frosted" value="Frosted" />
              <Picker.Item label="Clear" value="Clear" />
            </Picker>
          </View>

          <Text style={styles.label}>Frame Material:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={item.frameMaterial}
              onValueChange={(val) => updateWindow(item.id, 'frameMaterial', val)}
              style={styles.picker}
            >
              <Picker.Item label="Aluminum" value="Aluminum" />
              <Picker.Item label="Wood" value="Wood" />
              <Picker.Item label="PVC" value="PVC" />
            </Picker>
          </View>

          {renderInput('Frame Price per Unit (R)', item.framePrice, (val) => updateWindow(item.id, 'framePrice', val), 'e.g. 250')}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.duplicateButton} onPress={() => duplicateWindow(item.id)}>
              <Text style={styles.duplicateButtonText}>📋 Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeWindow(item.id)}>
              <Text style={styles.removeButtonText}>❌ Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.calculateButton} onPress={calculateTotalPrice}>
        <Text style={styles.calculateButtonText}>💰 Calculate Total</Text>
      </TouchableOpacity>

      {totalPrice > 0 && (
        <Text style={styles.totalPrice}>Total Price: R {totalPrice} ({windows.length} windows)</Text>
      )}

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>➡️ Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const renderInput = (label, value, onChange, placeholder = '') => (
  <>
    <Text style={styles.label}>{label}:</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      keyboardType="numeric"
      value={value}
      onChangeText={onChange}
    />
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F5D409',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#F5D409',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#FF6F00',
    padding: 12,
    borderRadius: 10,
    flex: 1,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  windowContainer: {
    marginBottom: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F5D409',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  windowTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5D409',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#F5D409',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#F5D409',
    borderRadius: 8,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  picker: {
    height: 44,
    color: '#000',
  },
  duplicateButton: {
    backgroundColor: '#F5D409',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  duplicateButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#FF6F00',
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  removeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: '#F5D409',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
