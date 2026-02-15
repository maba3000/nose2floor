import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:nose2floor/features/pushup_counter/data/datasources/local_datasource.dart';
import 'package:nose2floor/features/pushup_counter/data/repositories/session_repository_impl.dart';
import 'package:nose2floor/features/pushup_counter/presentation/cubit/pushup_cubit.dart';
import 'package:nose2floor/features/pushup_counter/presentation/screens/home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final datasource = LocalDatasource(prefs);
  final repository = SessionRepositoryImpl(datasource);

  runApp(Nose2FloorApp(repository: repository));
}

class Nose2FloorApp extends StatelessWidget {
  const Nose2FloorApp({required this.repository, super.key});

  final SessionRepositoryImpl repository;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => PushupCubit(repository)..loadInitialData(),
      child: MaterialApp(
        title: 'Nose2Floor',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
        home: const HomeScreen(),
      ),
    );
  }
}
