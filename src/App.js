import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import { applyPlugin } from 'jspdf-autotable'

applyPlugin(jsPDF)

export default function App() {
  const [crackers, setCrackers] = useState([]);
  const [customer, setCustomer] = useState({ name: "", address: "", phone: "" });

  // Load CSV once
  useEffect(() => {
    fetch(process.env.PUBLIC_URL+"/crackers.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const results = Papa.parse(csvText, { header: true });
        const data = results.data
          .filter((row) => row.Name) // remove empty rows
          .map((row) => ({
            ...row,
            Name: row.Name.trim(),
            Unit: row.Unit.trim(),
            Category: row.Category?.trim(),
            ActualPrice: parseFloat(row.ActualPrice),
            OfferPrice: parseFloat(row.OfferPrice),
            Quantity: 0,
            Total: 0,
          }));
        setCrackers(data);
      });
  }, []);

  // Update quantity
  const updateQuantity = (index, qty) => {
    const newCrackers = [...crackers];
    newCrackers[index].Quantity = Math.max(0, qty);
    newCrackers[index].Total =
      newCrackers[index].Quantity * newCrackers[index].OfferPrice;
    setCrackers(newCrackers);
  };

  // Grand total
  const grandTotal = crackers.reduce((sum, item) => sum + item.Total, 0);

  // Generate PDF
  const generatePDF = () => {
  if (!customer.name || !customer.address || !customer.phone || grandTotal === 0) {
    alert("Fill all customer info and select at least one item!");
    return;
  }

  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Sivakasi Crackers - Order Summary", 14, 20);

  // Customer info
  doc.setFontSize(12);
  doc.text(`Name: ${customer.name}`, 14, 30);
  doc.text(`Address: ${customer.address}`, 14, 37);
  doc.text(`Phone: ${customer.phone}`, 14, 44);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 51);

  // Group crackers
  const grouped = crackers.reduce((acc, item) => {
    if (item.Quantity > 0) {
      if (!acc[item.Category]) acc[item.Category] = [];
      acc[item.Category].push(item);
    }
    return acc;
  }, {});

  let startY = 60;

  // Loop categories
  Object.keys(grouped).forEach((cat) => {
    // Category heading
    doc.setFontSize(13);
    doc.text(cat, 14, startY);
    startY += 6;

    // Table for that category
    doc.autoTable({
      head: [["Name", "Unit", "Offer Price", "Qty", "Total"]],
      body: grouped[cat].map((item) => [
        item.Name,
        item.Unit,
        item.OfferPrice,
        item.Quantity,
        item.Total,
      ]),
      startY: startY,
      theme: "grid",
      styles: { fontSize: 11 },
      headStyles: { fillColor: [200, 0, 0] },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "center" },
        4: { halign: "right" },
      },
    });

    startY = doc.lastAutoTable.finalY + 10;
  });

  // Grand total
  doc.setFontSize(14);
  doc.text(`Grand Total: ${grandTotal}`, 14, startY);

  // Save file
  doc.save(`Order_${Date.now()}.pdf`);
  };



  // Group crackers by category
  const grouped = crackers.reduce((acc, item) => {
    if (!acc[item.Category]) acc[item.Category] = [];
    acc[item.Category].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", fontSize: 20 }}>
      <h1>🎆 Sivakasi Crackers</h1>
      <h3>Flat 50% Discount! Only for Limited Time</h3>

      <div style={{ marginTop: "20px", fontSize: 25 }}>
        <h3>📝 Customer Info</h3>
        <input
          type="text"
          placeholder="Name"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          style={{ marginRight: "10px", padding: "10px", width: 300, fontSize: 20  }}
        />
        <br />
        <br />
        <input
          type="text"
          placeholder="Address"
          value={customer.address}
          onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
          style={{ marginRight: "10px", padding: "10px", width: 300, fontSize: 20  }}
        />
        <br />
        <br />
        <input
          type="text"
          placeholder="Phone"
          value={customer.phone}
          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          style={{ marginRight: "10px", padding: "10px", width: 300, fontSize: 20  }}
        />
      </div>

      <h3>💰 Grand Total: ₹{grandTotal}</h3>

      <table
        border="1"
        cellPadding="5"
        style={{
          marginTop: "20px",
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "red", color: "white", textAlign: "center" }}>
            <th>Name</th>
            <th>Unit</th>
            <th>Actual Price</th>
            <th>Offer Price</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(grouped).map((cat, catIdx) => (
            <React.Fragment key={catIdx}>
              {/* Category Header Row */}
              <tr style={{ backgroundColor: "#ddd", fontWeight: "bold" }}>
                <td colSpan="6" style={{ textAlign: "left", padding: "10px" }}>
                  {cat}
                </td>
              </tr>

              {/* Items under category */}
              {grouped[cat].map((item, idx) => (
                <tr
                  key={idx}
                  style={{ backgroundColor: "#f5f5dc", textAlign: "center" }}
                >
                  <td>{item.Name}</td>
                  <td>{item.Unit}</td>
                  <td>₹{item.ActualPrice}</td>
                  <td>₹{item.OfferPrice}</td>
                  <td>
                    <button
                      onClick={() =>
                        updateQuantity(crackers.indexOf(item), item.Quantity - 1)
                      }
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.Quantity}
                      min="0"
                      style={{ width: "50px", textAlign: "center" }}
                      onChange={(e) =>
                        updateQuantity(
                          crackers.indexOf(item),
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        updateQuantity(crackers.indexOf(item), item.Quantity + 1)
                      }
                    >
                      +
                    </button>
                  </td>
                  <td>₹{item.Total}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <button
        style={{ marginTop: "20px", padding: "20px", fontSize: "20px" }}
        onClick={generatePDF}
      >
        ⬇️ Download Order (PDF)
      </button>
    </div>
  );
}
