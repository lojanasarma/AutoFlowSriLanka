import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class TestPerms {
    public static void main(String[] args) {
        String url = System.getenv("SQLSERVER_JDBC_URL");
        String user = System.getenv("SQLSERVER_USERNAME");
        String pass = System.getenv("SQLSERVER_PASSWORD");
        if (url == null || user == null || pass == null) {
            throw new IllegalStateException("Set SQLSERVER_JDBC_URL, SQLSERVER_USERNAME, and SQLSERVER_PASSWORD first");
        }
        try {
            Connection conn = DriverManager.getConnection(url, user, pass);
            Statement stmt = conn.createStatement();
            stmt.execute("CREATE TABLE TestTable (id INT)");
            System.out.println("Successfully created TestTable!");
            stmt.execute("DROP TABLE TestTable");
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
