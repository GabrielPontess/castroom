import ActiveRooms from "@/components/ActiveRooms";
import JoinForm from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="card hero">
        <div className="hero-copy">
          <div className="brand-block">
            <div>
              <div className="wordmark">Castroom</div>
              <h1>Videochamadas para aulas online</h1>
            </div>
            <p>
              Crie ou entre em uma sala, revise seus dispositivos e conduza uma aula ao vivo em uma
              interface direta, silenciosa e pronta para validacao externa.
            </p>
          </div>

          <ActiveRooms />
        </div>
        <div className="panel">
          <JoinForm />
        </div>
      </section>
    </main>
  );
}
