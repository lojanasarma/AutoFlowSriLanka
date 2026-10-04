import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

public class ListTables {
    public static void main(String[] args) {
        String url = System.getenv("SQLSERVER_JDBC_URL");
        String user = System.getenv("SQLSERVER_USERNAME");
        String pass = System.getenv("SQLSERVER_PASSWORD");
        if (url == null || user == null || pass == null) {
            throw new IllegalStateException("Set SQLSERVER_JDBC_URL, SQLSERVER_USERNAME, and SQLSERVER_PASSWORD first");
        }
        try {
            Connection conn = DriverManager.getConnection(url, user, pass);
            DatabaseMetaData md = conn.getMetaData();
            ResultSet rs = md.getTables(null, null, "%", new String[]{ "TABLE" });
            while (rs.next()) {
                System.out.println(rs.getString(3));
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
