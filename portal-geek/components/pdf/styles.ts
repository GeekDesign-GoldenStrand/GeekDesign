import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 45,
    marginRight: 8,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E11D48",
    letterSpacing: 1,
  },
  companyTextContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  companySlogan: {
    fontSize: 7,
    color: "#6B7280",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  companyDetail: {
    color: "#4B5563",
    fontSize: 9,
    marginBottom: 2,
  },
  headerInfo: {
    textAlign: "right",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },
  branchText: {
    color: "#4B5563",
    marginBottom: 2,
    fontSize: 9,
  },
  headerRightTable: {
    marginTop: 8,
    width: 180,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerRightRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerRightLabelCol: {
    backgroundColor: "#F3F4F6",
    padding: 4,
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    justifyContent: "center",
  },
  headerRightLabelText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#4B5563",
  },
  headerRightValueCol: {
    padding: 4,
    width: "60%",
    justifyContent: "center",
  },
  headerRightValueText: {
    fontSize: 8,
    color: "#111827",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "#F3F4F6",
    padding: 5,
    marginBottom: 10,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 100,
    fontWeight: "bold",
    color: "#4B5563",
  },
  value: {
    flex: 1,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    width: "100%",
  },
  tableColHeader: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#E11D48",
    padding: 6,
  },
  tableCol: {
    borderStyle: "solid",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#D1D5DB",
    padding: 6,
  },
  tableCellHeader: {
    fontWeight: "bold",
    fontSize: 9,
    color: "#FFFFFF",
    textAlign: "center",
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  totalsContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: "bold",
  },
  totalValue: {
    textAlign: "right",
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 5,
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  termItem: {
    marginBottom: 4,
    flexDirection: "row",
  },
  termItemTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#111827",
  },
  termItemText: {
    fontSize: 7,
    color: "#4B5563",
    lineHeight: 1.4,
  },
  bankInfoContainer: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#E11D48",
  },
  bankInfoHeader: {
    backgroundColor: "#E11D48",
    padding: 6,
    alignItems: "center",
  },
  bankInfoHeaderText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 10,
  },
  bankInfoBody: {
    flexDirection: "row",
  },
  bankInfoLeft: {
    width: "45%",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
  },
  bankInfoRight: {
    width: "55%",
    padding: 10,
    justifyContent: "center",
  },
  bankInfoText: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 4,
    textAlign: "center",
  },
  bankInfoFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bankInfoLogoText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8b5cf6", // A purple hue for BanBajío
    fontFamily: "Helvetica-Bold",
  },
  bankInfoLogoImage: {
    width: 90,
    height: "auto",
    marginRight: 20,
  },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#E11D48",
    fontSize: 8,
  },
});
