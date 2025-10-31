import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext'; // Import hook kita
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Daftarkan komponen-komponen Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function Home() {
    const { user, logout, apiClient, token } = useAuth(); // Ambil fungsi logout, dll
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        // Jika tidak ada token, paksa kembali ke halaman login
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const productResponse = await apiClient.get('/products');
                const chartResponse = await apiClient.get('/sales-summary');
                setChartData(chartResponse.data)
                setProducts(productResponse.data);
            } catch (err) {
                setError('Gagal mengambil data produk.');
                if (err.response && err.response.status === 401) {
                    // Jika token tidak valid/expired
                    logout();
                    navigate('/login');
                }
            }
        };

        fetchData();
    }, [token, navigate, apiClient, logout]); // Tambahkan dependensi

    const handleLogout = () => {
        logout();
        navigate('/login'); // Arahkan ke login setelah logout
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Project Ajarindongdit (Dashboard)</h1>
            <button onClick={handleLogout} style={{ float: 'right' }}>Logout</button>
            <hr />
            <h2>Analisis Penjualan Mingguan</h2>
            <div style={{ width: '80%', margin: 'auto' }}>
                {chartData ? (
                    <Bar data={chartData} />
                ) : (
                    <p>Memuat data grafik...</p>
                )}
            </div>

            <hr style={{ margin: '20px 0' }} />
            <h2>Data Produk dari PostgreSQL:</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {products.length > 0 ? (
                <table border="1" cellPadding="5">
                    <thead>
                        <tr><th>ID</th><th>Nama Produk</th><th>Harga</th><th>Stok</th></tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>{product.nama_produk}</td>
                                <td>Rp {product.harga}</td>
                                <td>{product.stok}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Memuat data produk...</p>
            )}
        </div>
    );
}

export default Home;